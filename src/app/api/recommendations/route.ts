import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { generateRecommendations } from "@/lib/ai";
import { prisma } from "@/lib/db/client";
import { parseJson } from "@/lib/utils";
import { SkinSummary, StyleIntention } from "@/types";
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

    // Generate recommendations
    const recommendations = await generateRecommendations(
      userId!,
      skinSummary,
      intention as StyleIntention
    );

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
    console.error("[recommendations]", err);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
