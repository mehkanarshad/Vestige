import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { estimateGarmentColor } from "@/lib/garment-color";
import { deltaE2000, hexToLab, scoreGarmentColor } from "@/lib/color-science";
import { loadSkinAnalysisHistory } from "@/lib/skin-analysis-history";
import { SkinPassport } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await req.formData();
    const image = formData.get("garmentImage");
    const colorOverride = formData.get("colorHex");
    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Upload a garment photo to score its color" }, { status: 400 });
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      return NextResponse.json({ error: "Use a JPEG, PNG, or WebP garment photo" }, { status: 400 });
    }
    if (image.size === 0 || image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Garment photo must be smaller than 10 MB" }, { status: 400 });
    }

    const [profile, skinHistory] = await Promise.all([
      prisma.styleProfile.findUnique({ where: { userId: userId! } }),
      loadSkinAnalysisHistory(userId!),
    ]);
    const passport = profile?.skinPassport
      ? (JSON.parse(profile.skinPassport) as SkinPassport)
      : null;
    const skinLab = [...skinHistory]
      .reverse()
      .find((analysis) => analysis.summary.skinLab)?.summary.skinLab ?? passport?.skinLab;
    if (!skinLab) {
      return NextResponse.json(
        { error: "Complete your skin analysis to create your Skin Passport first" },
        { status: 409 }
      );
    }

    const source = Buffer.from(await image.arrayBuffer());
    const metadata = await sharp(source).metadata();
    if (!metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 128) {
      return NextResponse.json(
        { error: "Garment photo dimensions must be at least 128 pixels" },
        { status: 400 }
      );
    }

    const estimate = await estimateGarmentColor(source);
    const garmentColorHex =
      typeof colorOverride === "string" && /^#[\da-f]{6}$/i.test(colorOverride)
        ? colorOverride.toLowerCase()
        : estimate.hex;
    const garmentLab = hexToLab(garmentColorHex);
    const match = scoreGarmentColor(skinLab, garmentLab);

    return NextResponse.json({
      garmentColorHex,
      garmentLab,
      colorConfidence: estimate.confidence,
      score: match.score,
      deltaE: match.deltaE,
      lightnessContrast: match.lightnessContrast,
      hueHarmony: match.hueHarmony,
      label: match.label,
    });
  } catch (err) {
    console.error("[garment-score]", err);
    return NextResponse.json({ error: "Could not score this garment color" }, { status: 500 });
  }
}