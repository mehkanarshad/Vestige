import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { createStyleEvolutionSnapshot, updateStyleProfile } from "@/lib/ai";
import { recomputeGarmentPreferences } from "@/lib/garment-interactions";
import { ratingForAction } from "@/lib/collaborative-filter";
import { OutfitRecommendation } from "@/types";
import { parseJson } from "@/lib/utils";
import { z } from "zod";

const FeedbackSchema = z.object({
  sessionId: z.string(),
  type: z.enum(["liked", "rejected", "adjusted"]),
  detail: z.string().max(500).optional(),
  outfitId: z.string().optional(),
});

function isOutfitRecommendation(value: unknown): value is OutfitRecommendation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && Array.isArray(candidate.items);
}

function hasGarmentId(value: unknown): value is { garmentId: string } {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as Record<string, unknown>).garmentId === "string"
  );
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { sessionId, type, detail, outfitId } =
      FeedbackSchema.parse(body);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const parsedRecommendations = parseJson<unknown>(session.recommendations);
    const recommendations = Array.isArray(parsedRecommendations)
      ? parsedRecommendations.filter(isOutfitRecommendation)
      : [];
    const parsedSelectedOutfit = parseJson<unknown>(session.selectedOutfit);
    const storedSelectedOutfit = isOutfitRecommendation(parsedSelectedOutfit)
      ? parsedSelectedOutfit
      : null;
    const selectedOutfit = storedSelectedOutfit
      ?? recommendations.find((recommendation) => recommendation.id === outfitId)
      ?? null;
    if (outfitId && selectedOutfit && outfitId !== selectedOutfit.id) {
      return NextResponse.json({ error: "Selected outfit does not match this session" }, { status: 400 });
    }
    const feedbackOutfit = selectedOutfit && Array.isArray(selectedOutfit.items)
      ? selectedOutfit
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          sessionId,
          type,
          detail: detail ?? null,
          outfitId: feedbackOutfit?.id ?? null,
          outfit: feedbackOutfit ? JSON.stringify(feedbackOutfit) : null,
        },
      });

      await tx.session.update({
        where: { id: sessionId },
        data: { completedStep: Math.max(session.completedStep, 6) },
      });

      let interactionCount: number | null = null;
      if (
        feedbackOutfit &&
        (type === "liked" || type === "rejected")
      ) {
        const garmentIds = [...new Set(
          feedbackOutfit.items.flatMap((item) =>
            hasGarmentId(item) ? [item.garmentId] : []
          )
        )];
        if (garmentIds.length > 0) {
          const [garments, existingInteractions] = await Promise.all([
            tx.garment.findMany({
              where: {
                id: { in: garmentIds },
                OR: [
                  { ownerUserId: userId!, source: "user_upload" },
                  { ownerUserId: null, source: "catalog" },
                ],
              },
              select: { id: true },
            }),
            tx.garmentInteraction.findMany({
              where: { userId: userId!, sessionId },
              select: { garmentId: true },
            }),
          ]);
          const alreadyRecorded = new Set(existingInteractions.map(({ garmentId }) => garmentId));
          const validGarmentIds = garments
            .map(({ id }) => id)
            .filter((id) => !alreadyRecorded.has(id));
          for (const garmentId of validGarmentIds) {
            await tx.garmentInteraction.create({
              data: {
                userId: userId!,
                garmentId,
                sessionId,
                action: type,
                rating: ratingForAction(type),
              },
            });
          }
          if (validGarmentIds.length > 0) {
            const preferences = await recomputeGarmentPreferences(userId!, tx);
            interactionCount = preferences.interactionCount;
          }
        }
      }
      return { feedback, interactionCount };
    });

    // Async profile update (non-blocking — don't await for the response)
    updateStyleProfile(userId!, sessionId).catch((err) => {
      console.error("[profile-update]", err);
    });
    createStyleEvolutionSnapshot(userId!).catch((err) => {
      console.error("[style-evolution]", err);
    });

    return NextResponse.json({
      id: result.feedback.id,
      ok: true,
      ...(result.interactionCount === null ? {} : { interactionCount: result.interactionCount }),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[feedback]", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
