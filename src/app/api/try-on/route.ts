import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { virtualTryOn } from "@/lib/youcam";
import { YouCamApiError } from "@/lib/youcam/client";
import { prisma } from "@/lib/db/client";
import { z } from "zod";
import sharp from "sharp";
import { estimateGarmentColor } from "@/lib/garment-color";
import { scoreGarmentColor, hexToLab } from "@/lib/color-science";
import { resolveGarmentImageSource } from "@/lib/garment-image";
import { SkinPassport } from "@/types";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  sessionId: z.string(),
  outfitId: z.string(),
  garmentName: z.string().trim().min(1).max(120),
  garmentCategory: z.enum(["top", "bottom", "dress", "outerwear"]).default("top"),
  garmentColorHex: z.string().regex(/^#[\da-f]{6}$/i).optional(),
  garmentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await req.formData();
    const uploadedFile = formData.get("garmentImage");
    const garmentFile = uploadedFile instanceof File ? uploadedFile : null;
    const reuseSavedGarment = formData.get("reuseSavedGarment") === "true";
    const { sessionId, outfitId, garmentName, garmentCategory, garmentColorHex, garmentId } =
      RequestSchema.parse({
        sessionId: formData.get("sessionId"),
        outfitId: formData.get("outfitId"),
        garmentName: formData.get("garmentName"),
        garmentCategory: formData.get("garmentCategory"),
        garmentColorHex: formData.get("garmentColorHex") || undefined,
        garmentId: formData.get("garmentId") || undefined,
      });

    if (!garmentFile && !reuseSavedGarment && !garmentId) {
      return NextResponse.json(
        { error: "Upload a photo of the garment" },
        { status: 400 }
      );
    }
    if (garmentFile && !["image/jpeg", "image/png", "image/webp"].includes(garmentFile.type)) {
      return NextResponse.json({ error: "Garment photo must be a JPEG, PNG, or WebP image" }, { status: 400 });
    }
    if (garmentFile && (garmentFile.size === 0 || garmentFile.size > 10 * 1024 * 1024)) {
      return NextResponse.json({ error: "Garment photo must be smaller than 10 MB" }, { status: 400 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const targetGarmentId = garmentId ?? (reuseSavedGarment ? session.tryOnGarmentId ?? undefined : undefined);
    const selectedGarmentRecord = targetGarmentId
      ? await prisma.garment.findUnique({ where: { id: targetGarmentId } })
      : null;
    if (
      targetGarmentId &&
      (!selectedGarmentRecord ||
        (selectedGarmentRecord.ownerUserId !== null && selectedGarmentRecord.ownerUserId !== userId))
    ) {
      return NextResponse.json({ error: "Garment not found" }, { status: 404 });
    }

    if (!session.photoUrl) {
      return NextResponse.json(
        { error: "No user photo available for try-on" },
        { status: 400 }
      );
    }

    const profile = await prisma.styleProfile.findUnique({ where: { userId: userId! } });
    const passport = profile?.skinPassport
      ? (JSON.parse(profile.skinPassport) as SkinPassport)
      : null;
    if (!passport?.skinLab) {
      return NextResponse.json(
        { error: "Complete your skin analysis to create your Skin Passport first" },
        { status: 409 }
      );
    }

    const recommendations = session.recommendations
      ? JSON.parse(session.recommendations)
      : [];
    const selectedOutfit = recommendations.find(
      (recommendation: { id: string }) => recommendation.id === outfitId
    );
    if (!selectedOutfit) {
      return NextResponse.json(
        { error: "Choose one of this session's recommended looks" },
        { status: 400 }
      );
    }

    let normalizedGarment: Buffer | null = null;
    let garmentImageUrl: string | undefined;
    let savedImageData: string | null = null;
    if (garmentFile) {
      const sourceGarment = Buffer.from(await garmentFile.arrayBuffer());
      const garmentMetadata = await sharp(sourceGarment).metadata();
      if (
        !garmentMetadata.width ||
        !garmentMetadata.height ||
        Math.min(garmentMetadata.width, garmentMetadata.height) < 128
      ) {
        return NextResponse.json(
          { error: "Garment photo dimensions must be at least 128 pixels" },
          { status: 400 }
        );
      }
      normalizedGarment = await sharp(sourceGarment)
        .rotate()
        .resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 90 })
        .toBuffer();
    } else if (selectedGarmentRecord) {
      const image = resolveGarmentImageSource(
        selectedGarmentRecord.imageData,
        selectedGarmentRecord.imageUrl
      );
      if (!image) {
        return NextResponse.json({ error: "This garment has no renderable image" }, { status: 400 });
      }
      if (image.imageData) {
        const savedImage = /^data:image\/jpeg;base64,([\s\S]+)$/.exec(image.imageData);
        if (!savedImage) {
          return NextResponse.json({ error: "This garment has no renderable image" }, { status: 400 });
        }
        normalizedGarment = Buffer.from(savedImage[1], "base64");
      } else {
        garmentImageUrl = image.imageUrl;
      }
    } else {
      const savedGarment = /^data:image\/jpeg;base64,([\s\S]+)$/.exec(
        session.tryOnGarmentImage ?? ""
      );
      if (!savedGarment) {
        return NextResponse.json({ error: "No saved garment is available" }, { status: 400 });
      }
      normalizedGarment = Buffer.from(savedGarment[1], "base64");
    }

    const estimate = normalizedGarment
      ? await estimateGarmentColor(normalizedGarment)
      : null;
    const selectedColor = garmentColorHex ?? selectedGarmentRecord?.colorHex ?? session.tryOnGarmentColor ?? estimate?.hex;
    if (!selectedColor) {
      return NextResponse.json({ error: "Garment color is unavailable for scoring" }, { status: 400 });
    }
    const colorMatch = scoreGarmentColor(passport.skinLab, hexToLab(selectedColor));

    if (normalizedGarment) {
      savedImageData = `data:image/jpeg;base64,${normalizedGarment.toString("base64")}`;
    }
    const imageHash = normalizedGarment
      ? createHash("sha256").update(normalizedGarment).digest("hex")
      : createHash("sha256").update(garmentImageUrl ?? savedImageData ?? "").digest("hex");
    let garmentRecord = selectedGarmentRecord;
    if (!garmentRecord) {
      garmentRecord = await prisma.garment.findFirst({
        where: { ownerUserId: userId!, imageHash, source: "user_upload" },
      });
      const garmentData = {
        ownerUserId: userId!,
        source: "user_upload",
        imageHash,
        name: garmentName,
        category: garmentCategory,
        imageData: savedImageData,
        colorHex: selectedColor,
        colorLab: JSON.stringify(hexToLab(selectedColor)),
        colorConfidence: estimate?.confidence ?? 1,
      };
      garmentRecord = garmentRecord
        ? await prisma.garment.update({ where: { id: garmentRecord.id }, data: garmentData })
        : await prisma.garment.create({ data: garmentData });
    } else if (garmentRecord.ownerUserId === userId) {
      garmentRecord = await prisma.garment.update({
        where: { id: garmentRecord.id },
        data: {
          name: garmentName,
          category: garmentCategory,
          colorHex: selectedColor,
          colorLab: JSON.stringify(hexToLab(selectedColor)),
        },
      });
    }
    const storedImage = garmentImageUrl ?? savedImageData ?? garmentRecord.imageUrl ?? garmentRecord.imageData;
    if (!storedImage) {
      return NextResponse.json({ error: "Garment image is unavailable" }, { status: 400 });
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        selectedOutfit: JSON.stringify(selectedOutfit),
        tryOnGarmentId: garmentRecord.id,
        tryOnGarmentImage: storedImage,
        tryOnGarmentName: garmentName,
        tryOnGarmentCategory: garmentCategory,
        tryOnGarmentColor: selectedColor,
        tryOnColorScore: colorMatch.score,
        tryOnColorDeltaE: colorMatch.deltaE,
        tryOnColorContrast: colorMatch.lightnessContrast,
        tryOnColorHarmony: colorMatch.hueHarmony,
        tryOnImageUrl: "",
      },
    });

    const dataUri = /^data:(image\/(?:jpeg|png));base64,([\s\S]+)$/.exec(
      session.photoUrl
    );
    if (session.photoUrl.startsWith("data:") && !dataUri) {
      return NextResponse.json(
        { error: "The saved photo format is not supported for try-on" },
        { status: 400 }
      );
    }

    const result = await virtualTryOn({
      userPhotoUrl: dataUri ? undefined : session.photoUrl,
      userPhotoBase64: dataUri?.[2],
      userPhotoType: dataUri?.[1] as "image/jpeg" | "image/png" | undefined,
      garmentImage: normalizedGarment ?? undefined,
      garmentImageType: normalizedGarment ? "image/jpeg" : undefined,
      garmentImageUrl,
      garmentCategory,
    });

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        tryOnImageUrl: result.tryOnImageUrl,
        completedStep: Math.max(session.completedStep, 5),
      },
    });

    return NextResponse.json({
      garmentId: garmentRecord.id,
      tryOnImageUrl: result.tryOnImageUrl,
      garmentImageUrl: storedImage,
      garmentName,
      garmentCategory,
      garmentColorHex: selectedColor,
      colorScore: colorMatch.score,
      colorLabel: colorMatch.label,
      colorDeltaE: colorMatch.deltaE,
      colorContrast: colorMatch.lightnessContrast,
      colorHarmony: colorMatch.hueHarmony,
      colorConfidence: estimate?.confidence ?? garmentRecord.colorConfidence ?? 1,
    });
  } catch (err) {
    if (err instanceof YouCamApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode ?? 500 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[try-on]", err);
    return NextResponse.json({ error: "Try-on failed" }, { status: 500 });
  }
}
