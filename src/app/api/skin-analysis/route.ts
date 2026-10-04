import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { analyzeSkin } from "@/lib/youcam";
import { YouCamApiError } from "@/lib/youcam/client";
import { prisma } from "@/lib/db/client";
import { saveSkinPassport, summaryFromSkinPassport } from "@/lib/skin-passport";
import { SkinPassport, SkinSummary, SkinAnalysisRaw } from "@/types";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string | null;
    const file = formData.get("photo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      return NextResponse.json(
        { error: "Photo must be a JPEG, PNG, or WebP image" },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Photo must be smaller than 10 MB" },
        { status: 400 }
      );
    }

    const original = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(original).metadata();
    if (!metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 480) {
      return NextResponse.json(
        { error: "Photo dimensions must be at least 480 pixels on the short side" },
        { status: 400 }
      );
    }
    const image = await sharp(original)
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();

    const profile = await prisma.styleProfile.findUnique({ where: { userId: userId! } });
    const passport = profile?.skinPassport
      ? (JSON.parse(profile.skinPassport) as SkinPassport)
      : null;

    let raw: SkinAnalysisRaw;
    let summary: SkinSummary;
    if (passport?.skinLab) {
      summary = summaryFromSkinPassport(passport);
      raw = {
        skinAnalysis: { source: "stored_skin_passport" },
        facialColorAnalysis: { source: "stored_skin_passport" },
      };
    } else {
      const analysis = await analyzeSkin({ image });
      raw = analysis.raw;
      summary = analysis.summary;
      await saveSkinPassport(userId!, summary);
    }

    const photoDataUrl = `data:image/jpeg;base64,${image.toString("base64")}`;

    // Persist to session if sessionId provided
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      if (session && session.userId === userId) {
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            photoUrl: photoDataUrl,
            skinAnalysisRaw: JSON.stringify(raw),
            skinSummary: JSON.stringify(summary),
            completedStep: Math.max(session.completedStep, 2),
          },
        });
      }
    }

    return NextResponse.json({ summary, sessionId });
  } catch (err) {
    if (err instanceof YouCamApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode ?? 500 }
      );
    }
    console.error("[skin-analysis]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
