import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { analyzeSkin, SkinAnalysisError } from "@/lib/youcam";
import { prisma } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 30;

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

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type.includes("png") ? "png" : "jpeg";

    // Call YouCam Skin Analysis (or mock)
    const { raw, summary } = await analyzeSkin({
      imageBase64: base64,
      imageType: mimeType,
    });

    // Store a data-URI as the photo URL for display purposes
    const photoDataUrl = `data:image/${mimeType};base64,${base64}`;

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
    if (err instanceof SkinAnalysisError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode ?? 500 }
      );
    }
    console.error("[skin-analysis]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
