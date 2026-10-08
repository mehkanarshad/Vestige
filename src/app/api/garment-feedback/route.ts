import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { ratingForAction } from "@/lib/collaborative-filter";
import { recomputeGarmentPreferences } from "@/lib/garment-interactions";

const FeedbackSchema = z.object({
  sessionId: z.string(),
  action: z.enum(["liked", "rejected", "more_like_this"]),
});

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { sessionId, action } = FeedbackSchema.parse(await req.json());
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId || !session.tryOnGarmentId) {
      return NextResponse.json({ error: "No rendered garment found for this session" }, { status: 404 });
    }

    const garment = await prisma.garment.findUnique({
      where: { id: session.tryOnGarmentId },
      select: { id: true, ownerUserId: true, source: true },
    });
    if (
      !garment ||
      (garment.ownerUserId !== userId &&
        !(garment.source === "catalog" && garment.ownerUserId === null))
    ) {
      return NextResponse.json({ error: "Garment not found" }, { status: 404 });
    }

    await prisma.garmentInteraction.upsert({
      where: {
        userId_garmentId_sessionId: {
          userId: userId!,
          garmentId: garment.id,
          sessionId,
        },
      },
      create: {
        userId: userId!,
        garmentId: garment.id,
        sessionId,
        action,
        rating: ratingForAction(action),
      },
      update: {
        action,
        rating: ratingForAction(action),
        createdAt: new Date(),
      },
    });

    const preferences = await recomputeGarmentPreferences(userId!);
    const profile = await prisma.styleProfile.findUnique({
      where: { userId: userId! },
      select: { preferenceRevision: true },
    });
    return NextResponse.json({
      ok: true,
      interactionCount: preferences.interactionCount,
      preferenceRevision: profile?.preferenceRevision ?? 0,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[garment-feedback]", err);
    return NextResponse.json({ error: "Could not save garment feedback" }, { status: 500 });
  }
}