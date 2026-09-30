import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { StyleProfileData, StyleEvolutionEntry } from "@/types";

export async function GET(_req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const [profileRow, evolutionRows] = await Promise.all([
    prisma.styleProfile.findUnique({ where: { userId: userId! } }),
    prisma.styleEvolution.findMany({
      where: { userId: userId! },
      orderBy: { snapshotAt: "asc" },
    }),
  ]);

  const profile: StyleProfileData = profileRow
    ? {
        skinTraits: parseJson(profileRow.skinTraits),
        preferredStyles: parseJson<string[]>(profileRow.preferredStyles) ?? [],
        avoidedStyles: parseJson<string[]>(profileRow.avoidedStyles) ?? [],
        intentions: parseJson<Record<string, number>>(profileRow.intentions) ?? {},
        colorPalette: parseJson<string[]>(profileRow.colorPalette) ?? [],
        styleSummary: profileRow.styleSummary ?? "",
        sessionCount: profileRow.sessionCount,
      }
    : {
        skinTraits: null,
        preferredStyles: [],
        avoidedStyles: [],
        intentions: {},
        colorPalette: [],
        styleSummary: "",
        sessionCount: 0,
      };

  const evolution: StyleEvolutionEntry[] = evolutionRows.map((e) => ({
    id: e.id,
    snapshotAt: e.snapshotAt.toISOString(),
    summary: e.summary,
    traits: parseJson<StyleProfileData>(e.traits) ?? profile,
  }));

  return NextResponse.json({ profile, evolution });
}
