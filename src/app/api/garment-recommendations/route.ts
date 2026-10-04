import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { hexToLab, scoreGarmentColor } from "@/lib/color-science";
import {
  buildPreferenceVector,
  GarmentAttributes,
  rankGarments,
} from "@/lib/collaborative-filter";
import { parsePreferenceVector } from "@/lib/garment-interactions";
import { SkinPassport, LabColor } from "@/types";

export async function GET(_req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const profile = await prisma.styleProfile.findUnique({ where: { userId: userId! } });
    const passport = profile?.skinPassport
      ? (JSON.parse(profile.skinPassport) as SkinPassport)
      : null;
    if (!passport?.skinLab) {
      return NextResponse.json({ error: "Create your Skin Passport before ranking garments" }, { status: 409 });
    }

    const currentPreferences = parsePreferenceVector(profile?.garmentPreferences ?? null)
      ?? buildPreferenceVector([]);
    const peerProfiles = await prisma.styleProfile.findMany({
      where: { userId: { not: userId! }, garmentInteractionCount: { gte: 2 } },
      select: { userId: true, garmentPreferences: true },
    });
    const otherUsers = peerProfiles.flatMap((peer) => {
      const preferences = parsePreferenceVector(peer.garmentPreferences);
      return preferences ? [{ userId: peer.userId, preferences }] : [];
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
            { ownerUserId: null, source: "catalog" },
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
        },
      }),
    ]);

    const seenGarments = new Set(ownedInteractions.map((interaction) => interaction.garmentId));
    const candidates = visibleGarments.flatMap((garment) => {
      if (seenGarments.has(garment.id)) return [];
      if (!["top", "bottom", "dress", "outerwear"].includes(garment.category)) return [];
      try {
        const lab = JSON.parse(garment.colorLab) as LabColor;
        const attributes: GarmentAttributes = { category: garment.category, lab };
        return [{
          id: garment.id,
          attributes,
          skinColorScore: scoreGarmentColor(passport.skinLab, lab).score,
          name: garment.name,
          colorHex: garment.colorHex,
          imageUrl: garment.imageData ?? garment.imageUrl,
          source: garment.source,
        }];
      } catch {
        return [];
      }
    });

    const ranked = rankGarments(userId!, currentPreferences, otherUsers, candidates, 10);
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
          predictedSatisfaction: rankedGarment.predictedSatisfaction,
          skinColorScore: rankedGarment.skinColorScore,
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