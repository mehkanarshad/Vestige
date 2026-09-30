import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { virtualTryOn, VtoError } from "@/lib/youcam";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

export const maxDuration = 60;

const RequestSchema = z.object({
  sessionId: z.string(),
  outfitId: z.string(),
  garmentImageUrl: z.string().url().optional().default("https://placehold.co/400x600/C4B8A8/3D2B1F?text=Garment"),
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

    // For data-URI photos, VTO API needs a real URL.
    // In production, upload the photo to storage first.
    // In demo mode, the mock VTO handles this gracefully.
    const userPhotoUrl = session.photoUrl.startsWith("data:")
      ? "https://placehold.co/480x640/E8DDD0/3D2B1F?text=User+Photo"
      : session.photoUrl;

    const result = await virtualTryOn({
      userPhotoUrl,
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
    if (err instanceof VtoError) {
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
