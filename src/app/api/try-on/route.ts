import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { virtualTryOn } from "@/lib/youcam";
import { YouCamApiError } from "@/lib/youcam/client";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

export const maxDuration = 60;

const RequestSchema = z.object({
  sessionId: z.string(),
  outfitId: z.string(),
  garmentImageUrl: z.string().url(),
  garmentCategory: z.string().optional().default("top"),
});

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { sessionId, outfitId, garmentImageUrl, garmentCategory } =
      RequestSchema.parse(body);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.photoUrl) {
      return NextResponse.json(
        { error: "No user photo available for try-on" },
        { status: 400 }
      );
    }

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
      garmentImageUrl,
      garmentCategory,
    });

    // Save selected outfit + VTO result
    const recommendations = session.recommendations
      ? JSON.parse(session.recommendations)
      : [];
    const selectedOutfit = recommendations.find(
      (r: { id: string }) => r.id === outfitId
    ) ?? recommendations[0];

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        selectedOutfit: JSON.stringify(selectedOutfit),
        tryOnImageUrl: result.tryOnImageUrl,
        completedStep: Math.max(session.completedStep, 5),
      },
    });

    return NextResponse.json({ tryOnImageUrl: result.tryOnImageUrl });
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
