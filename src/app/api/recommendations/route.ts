import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { scoreGarmentColor } from "@/lib/color-science";
import {
  buildPreferenceVector,
  GarmentAttributes,
  rankGarments,
} from "@/lib/collaborative-filter";
import { parsePreferenceVector } from "@/lib/garment-interactions";
import { ingestChannel3Catalog, Channel3CatalogError } from "@/lib/channel3-catalog";
import { loadSkinAnalysisHistory } from "@/lib/skin-analysis-history";
import { LabColor, OutfitRecommendation, SkinPassport, SkinSummary } from "@/types";
import { z } from "zod";

export const maxDuration = 60;

const RequestSchema = z.object({
  sessionId: z.string(),
  intention: z.enum([
    "confident",
    "calm",
    "bold",
    "professional",
    "playful",
    "minimal",
    "experimental",
  ]),
});

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { sessionId, intention } = RequestSchema.parse(body);

    // Load session and verify ownership
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const skinSummary = parseJson<SkinSummary>(session.skinSummary);
    if (!skinSummary) {
      return NextResponse.json(
        { error: "Skin analysis not completed for this session" },
        { status: 400 }
      );
    }

    const [profile, skinHistory] = await Promise.all([
      prisma.styleProfile.findUnique({ where: { userId: userId! } }),
      loadSkinAnalysisHistory(userId!, session.createdAt),
    ]);
    const passport = parseJson<SkinPassport>(profile?.skinPassport ?? null);
    const skinLab = skinSummary.skinLab ?? passport?.skinLab;
    const previousSkinLab = [...skinHistory]
      .reverse()
      .find((analysis) => analysis.summary.skinLab)?.summary.skinLab;
    if (!skinLab) {
      return NextResponse.json(
        { error: "Complete your skin analysis before requesting catalog recommendations" },
        { status: 409 }
      );
    }

    const searchedGarmentIds = await ingestChannel3Catalog(intention);

    const [ownedInteractions, catalogGarments, peerProfiles] = await Promise.all([
      prisma.garmentInteraction.findMany({
        where: { userId: userId! },
        select: { garmentId: true },
      }),
      prisma.garment.findMany({
        where: {
          id: { in: searchedGarmentIds },
          source: "catalog",
          ownerUserId: null,
          availability: "InStock",
        },
      }),
      prisma.styleProfile.findMany({
        where: { userId: { not: userId! }, garmentInteractionCount: { gte: 2 } },
        select: { userId: true, garmentPreferences: true },
      }),
    ]);

    const seenGarments = new Set(ownedInteractions.map(({ garmentId }) => garmentId));
    const previousSkinColorScores = new Map<string, number>();
    const candidates = catalogGarments.flatMap((garment) => {
      if (seenGarments.has(garment.id) || !garment.imageUrl || !garment.productUrl) return [];
      try {
        const lab = JSON.parse(garment.colorLab) as LabColor;
        const catalogAttributes = parseJson<{
          tone?: string | null;
          silhouette?: string | null;
          formality?: string | null;
          style?: string | null;
          texture?: string | null;
        }>(garment.catalogAttributes);
        const attributes: GarmentAttributes = {
          category: garment.category,
          lab,
          tone: catalogAttributes?.tone,
          silhouette: catalogAttributes?.silhouette,
          formality: catalogAttributes?.formality,
          style: catalogAttributes?.style,
          texture: catalogAttributes?.texture,
        };
        const skinColorScore = scoreGarmentColor(skinLab, lab).score;
        if (previousSkinLab) {
          previousSkinColorScores.set(
            garment.id,
            scoreGarmentColor(previousSkinLab, lab).score
          );
        }
        return [{
          id: garment.id,
          attributes,
          skinColorScore,
        }];
      } catch (err) {
        console.warn("[recommendations] skipping catalog item with invalid stored attributes", garment.id, err);
        return [];
      }
    });

    const currentPreferences = parsePreferenceVector(profile?.garmentPreferences ?? null)
      ?? buildPreferenceVector([]);
    const otherUsers = peerProfiles.flatMap((peer) => {
      const preferences = parsePreferenceVector(peer.garmentPreferences);
      return preferences ? [{ userId: peer.userId, preferences }] : [];
    });
    const ranked = rankGarments(userId!, currentPreferences, otherUsers, candidates, 10);
    const garmentById = new Map(catalogGarments.map((garment) => [garment.id, garment]));
    const recommendations: OutfitRecommendation[] = ranked.slice(0, 3).flatMap((rankedGarment) => {
      const garment = garmentById.get(rankedGarment.id);
      if (!garment) return [];
      const attributes = parseJson<{
        tone?: string | null;
        silhouette?: string | null;
        formality?: string | null;
        style?: string | null;
        texture?: string | null;
        materials?: string[];
      }>(garment.catalogAttributes);
      const previousSkinColorScore = previousSkinColorScores.get(garment.id);
      const item = {
        category: garment.category as "top" | "bottom" | "dress" | "outerwear",
        name: garment.name,
        description: garment.description ?? garment.name,
        color: garment.colorHex,
        colorHex: garment.colorHex,
        garmentImageUrl: garment.imageUrl ?? undefined,
        garmentId: garment.id,
        brand: garment.brand ?? undefined,
        productUrl: garment.productUrl ?? undefined,
        price: garment.price ?? undefined,
        currency: garment.currency ?? undefined,
        attributes: {
          tone: attributes?.tone,
          silhouette: attributes?.silhouette,
          formality: attributes?.formality,
          style: attributes?.style,
          texture: attributes?.texture,
          materials: attributes?.materials,
        },
      };
      return [{
        id: `catalog-${garment.id}`,
        name: garment.name,
        description: garment.description ?? `${garment.category} by ${garment.brand ?? "our catalog"}.`,
        items: [item],
        colorPalette: [garment.colorHex],
        intention,
        personalizedReason: [
          `Ranked ${rankedGarment.predictedSatisfaction}/100 for color compatibility and your garment preferences.`,
          typeof previousSkinColorScore === "number"
            ? `Its skin-color match is ${rankedGarment.skinColorScore}/100, ${rankedGarment.skinColorScore > previousSkinColorScore ? "+" : ""}${rankedGarment.skinColorScore - previousSkinColorScore} points from the previous fresh color reading.`
            : null,
        ].filter(Boolean).join(" "),
        confidence: rankedGarment.predictedSatisfaction / 100,
      }];
    });
    if (recommendations.length === 0) {
      return NextResponse.json(
        { error: "No in-stock catalog products matched this recommendation. Try again shortly." },
        { status: 404 }
      );
    }

    // Persist
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        intention,
        recommendations: JSON.stringify(recommendations),
        completedStep: Math.max(session.completedStep, 4),
      },
    });

    return NextResponse.json({ recommendations });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof Channel3CatalogError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[recommendations]", err);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
