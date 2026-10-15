import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { scoreGarmentColor } from "@/lib/color-science";
import {
  buildPreferenceVector,
  CollaborativeContext,
  GarmentAttributes,
  rankGarments,
  scoreIntentionFit,
} from "@/lib/collaborative-filter";
import { parsePreferenceVector } from "@/lib/garment-interactions";
import { resolveGarmentImageSource } from "@/lib/garment-image";
import { loadSkinAnalysisHistory } from "@/lib/skin-analysis-history";
import { parseJson } from "@/lib/utils";
import { LabColor, SkinPassport, SkinSummary, StyleIntention } from "@/types";
import { hasFreshSkinAnalysis } from "@/lib/skin-trends";

const INTENTIONS = new Set<StyleIntention>([
  "confident",
  "calm",
  "bold",
  "professional",
  "playful",
  "minimal",
  "experimental",
]);

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId");
    const session = sessionId
      ? await prisma.session.findUnique({ where: { id: sessionId } })
      : null;
    if (sessionId && (!session || session.userId !== userId)) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const [profile, skinHistory] = await Promise.all([
      prisma.styleProfile.findUnique({ where: { userId: userId! } }),
      loadSkinAnalysisHistory(userId!, session?.createdAt),
    ]);
    const passport = profile?.skinPassport
      ? (JSON.parse(profile.skinPassport) as SkinPassport)
      : null;
    const sessionSummary = session && hasFreshSkinAnalysis(session.skinAnalysisRaw)
      ? parseJson<SkinSummary>(session.skinSummary)
      : null;
    const historicalSkinLabs = skinHistory.flatMap((analysis) =>
      analysis.summary.skinLab ? [analysis.summary.skinLab] : []
    );
    const skinLab = sessionSummary?.skinLab
      ?? historicalSkinLabs.at(-1)
      ?? passport?.skinLab;
    const recentSkinLabs = [
      ...historicalSkinLabs,
      ...(sessionSummary?.skinLab ? [sessionSummary.skinLab] : []),
    ].slice(-3);
    const intention = session && INTENTIONS.has(session.intention as StyleIntention)
      ? session.intention as StyleIntention
      : null;
    if (!skinLab) {
      return NextResponse.json({ error: "Create your Skin Passport before ranking garments" }, { status: 409 });
    }

    const currentPreferences = parsePreferenceVector(profile?.garmentPreferences ?? null)
      ?? buildPreferenceVector([]);
    const peerProfiles = await prisma.styleProfile.findMany({
      where: { userId: { not: userId! }, garmentInteractionCount: { gte: 2 } },
      select: {
        userId: true,
        garmentPreferences: true,
        skinPassport: true,
        intentions: true,
      },
    });
    const otherUsers = peerProfiles.flatMap((peer) => {
      const preferences = parsePreferenceVector(peer.garmentPreferences);
      if (!preferences) return [];
      const peerPassport = parseJson<SkinPassport>(peer.skinPassport);
      const peerSkinLab = peerPassport?.skinLab;
      const skinLabIsValid = Boolean(
        peerSkinLab &&
        Number.isFinite(peerSkinLab.l) &&
        Number.isFinite(peerSkinLab.a) &&
        Number.isFinite(peerSkinLab.b)
      );
      return [{
        userId: peer.userId,
        preferences,
        skinLab: skinLabIsValid ? peerSkinLab : null,
        intentions: parseJson<Record<string, number>>(peer.intentions) ?? {},
      }];
    });

    const [ownedInteractions, visibleGarments] = await Promise.all([
      prisma.garmentInteraction.findMany({
        where: { userId: userId! },
        select: { garmentId: true },
      }),
      prisma.garment.findMany({
        where: {
          OR: [
            { ownerUserId: userId!, source: "user_upload" },
            { ownerUserId: null, source: "catalog", availability: "InStock" },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          colorHex: true,
          colorLab: true,
          imageData: true,
          imageUrl: true,
          source: true,
          brand: true,
          productUrl: true,
          price: true,
          currency: true,
          availability: true,
          catalogAttributes: true,
        },
      }),
    ]);

    const seenGarments = new Set(ownedInteractions.map((interaction) => interaction.garmentId));
    const candidates = visibleGarments.flatMap((garment) => {
      if (seenGarments.has(garment.id)) return [];
      if (!["top", "bottom", "dress", "outerwear"].includes(garment.category)) return [];
      const image = resolveGarmentImageSource(garment.imageData, garment.imageUrl);
      if (!image) return [];
      try {
        const lab = JSON.parse(garment.colorLab) as LabColor;
        const facets = parseJson<{
          tone?: string | null;
          silhouette?: string | null;
          formality?: string | null;
          style?: string | null;
          texture?: string | null;
        }>(garment.catalogAttributes);
        const attributes: GarmentAttributes = {
          category: garment.category,
          lab,
          tone: facets?.tone,
          silhouette: facets?.silhouette,
          formality: facets?.formality,
          style: facets?.style,
          texture: facets?.texture,
        };
        const skinTrajectoryScore = recentSkinLabs.length >= 2
          ? Math.round(
              recentSkinLabs.reduce(
                (sum, historicalLab) => sum + scoreGarmentColor(historicalLab, lab).score,
                0
              ) / recentSkinLabs.length
            )
          : null;
        return [{
          id: garment.id,
          attributes,
          skinColorScore: scoreGarmentColor(skinLab, lab).score,
          skinTrajectoryScore,
          ...(intention ? { intentionScore: scoreIntentionFit(intention, attributes) } : {}),
          name: garment.name,
          colorHex: garment.colorHex,
          imageUrl: image.imageData ?? image.imageUrl,
          source: garment.source,
          brand: garment.brand,
          productUrl: garment.productUrl,
          price: garment.price,
          currency: garment.currency,
          availability: garment.availability,
          catalogAttributes: garment.catalogAttributes,
        }];
      } catch (err) {
        console.warn("[garment-recommendations] skipping garment with invalid stored attributes", garment.id, err);
        return [];
      }
    });

    const context: CollaborativeContext = { skinLab, intention };
    const ranked = rankGarments(
      userId!,
      currentPreferences,
      otherUsers,
      candidates,
      10,
      context
    );
    const garmentById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    return NextResponse.json({
      interactionCount: currentPreferences.interactionCount,
      preferenceRevision: profile?.preferenceRevision ?? 0,
      recommendations: ranked.map((rankedGarment) => {
        const candidate = garmentById.get(rankedGarment.id)!;
        return {
          garmentId: rankedGarment.id,
          name: candidate.name,
          category: rankedGarment.attributes.category,
          colorHex: candidate.colorHex,
          imageUrl: candidate.imageUrl,
          source: candidate.source,
          brand: candidate.brand,
          productUrl: candidate.productUrl,
          price: candidate.price,
          currency: candidate.currency,
          availability: candidate.availability,
          attributes: candidate.catalogAttributes
            ? JSON.parse(candidate.catalogAttributes)
            : null,
          predictedSatisfaction: rankedGarment.predictedSatisfaction,
          skinColorScore: rankedGarment.skinColorScore,
          skinTrajectoryScore: rankedGarment.skinTrajectoryScore,
          intentionScore: rankedGarment.intentionScore,
          userPreferenceScore: rankedGarment.userPreferenceScore,
          collaborativeScore: rankedGarment.collaborativeScore,
          neighborCount: rankedGarment.neighborCount,
        };
      }),
    });
  } catch (err) {
    console.error("[garment-recommendations]", err);
    return NextResponse.json({ error: "Could not rank garments" }, { status: 500 });
  }
}