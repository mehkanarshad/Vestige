import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/session-guard";
import { parseJson } from "@/lib/utils";
import { SkinSummary, OutfitRecommendation } from "@/types";

// GET /api/session/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });

  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...session,
    skinSummary: parseJson<SkinSummary>(session.skinSummary),
    skinAnalysisRaw: parseJson(session.skinAnalysisRaw),
    recommendations: parseJson<OutfitRecommendation[]>(session.recommendations),
    selectedOutfit: parseJson<OutfitRecommendation>(session.selectedOutfit),
  });
}

// PATCH /api/session/[id] — update fields on a session
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const session = await prisma.session.findUnique({ where: { id } });

  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const stringFields = [
    "intention",
    "photoUrl",
    "skinAnalysisRaw",
    "skinSummary",
    "recommendations",
    "selectedOutfit",
    "tryOnGarmentId",
    "tryOnGarmentImage",
    "tryOnGarmentName",
    "tryOnGarmentCategory",
    "tryOnGarmentColor",
    "tryOnImageUrl",
  ] as const;

  type StringField = typeof stringFields[number];
  const stringUpdate: Partial<Record<StringField, string>> = {};

  for (const key of stringFields) {
    if (key in body) {
      const val = body[key as string];
      stringUpdate[key] =
        typeof val === "object" ? JSON.stringify(val) : String(val);
    }
  }

  const numberFields = [
    "tryOnColorScore",
    "tryOnColorDeltaE",
    "tryOnColorContrast",
    "tryOnColorHarmony",
  ] as const;
  type NumberField = typeof numberFields[number];
  const numberUpdate: Partial<Record<NumberField, number | null>> = {};
  for (const key of numberFields) {
    if (key in body) {
      numberUpdate[key] = body[key] === null ? null : Number(body[key]);
    }
  }

  const completedStep =
    "completedStep" in body ? Number(body.completedStep) : undefined;

  const updated = await prisma.session.update({
    where: { id },
    data: {
      ...stringUpdate,
      ...numberUpdate,
      ...(completedStep !== undefined ? { completedStep } : {}),
    },
  });

  return NextResponse.json({ ok: true, completedStep: updated.completedStep });
}
