import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { analyzeSkin } from "@/lib/youcam";
import { YouCamApiError } from "@/lib/youcam/client";
import { prisma } from "@/lib/db/client";
import { saveSkinPassport } from "@/lib/skin-passport";
import { SkinAnalysisRaw, SkinSummary } from "@/types";
import { calculateSkinTrajectory, compareSkinAnalyses } from "@/lib/skin-trends";
import { loadSkinAnalysisHistory } from "@/lib/skin-analysis-history";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await req.formData();
    const sessionIdValue = formData.get("sessionId");
    const sessionId = typeof sessionIdValue === "string" ? sessionIdValue : null;
    const file = formData.get("photo") as File | null;

    if (!sessionId) {
      return NextResponse.json({ error: "A session ID is required" }, { status: 400 });
    }
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

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const skinHistory = await loadSkinAnalysisHistory(userId!, session.createdAt);
    const previousSession = skinHistory.at(-1);

    const analysis = await analyzeSkin({ image });
    const raw: SkinAnalysisRaw = analysis.raw;
    const summary: SkinSummary = analysis.summary;
    await saveSkinPassport(userId!, summary);
    const trajectory = calculateSkinTrajectory([
      ...skinHistory.map(({ summary: prior, capturedAt }) => ({
        summary: prior,
        capturedAt,
      })),
      { summary, capturedAt: session.createdAt },
    ]);
    const comparison = previousSession
      ? {
          ...compareSkinAnalyses(
          summary,
          previousSession.summary,
          previousSession.capturedAt,
          session.createdAt
          ),
          trajectory,
        }
      : null;

    const photoDataUrl = `data:image/jpeg;base64,${image.toString("base64")}`;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        photoUrl: photoDataUrl,
        skinAnalysisRaw: JSON.stringify(raw),
        skinSummary: JSON.stringify(summary),
        completedStep: Math.max(session.completedStep, 2),
      },
    });

    return NextResponse.json({ summary, sessionId, comparison });
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
