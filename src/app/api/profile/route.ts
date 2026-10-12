import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { StyleProfileData, StyleEvolutionEntry, SkinPassport, SkinTraits } from "@/types";
import { classifySkinUndertone } from "@/lib/color-science";

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

  const passport = parseJson<SkinPassport>(profileRow?.skinPassport);
  const storedSkinTraits = parseJson<SkinTraits>(profileRow?.skinTraits);
  const passportUndertone = passport
    ? classifySkinUndertone(passport.skinLab)
    : null;
  const skinTraits = storedSkinTraits
    ? {
        ...storedSkinTraits,
        undertone: storedSkinTraits.undertone === "not assessed" && passportUndertone
          ? passportUndertone
          : storedSkinTraits.undertone,
      }
    : null;
  const profile: StyleProfileData = profileRow
    ? {
        skinTraits,
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
