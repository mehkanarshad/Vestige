import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session-guard";
import { prisma } from "@/lib/db/client";
import { createStyleEvolutionSnapshot, updateStyleProfile } from "@/lib/ai";
import { z } from "zod";

const FeedbackSchema = z.object({
  sessionId: z.string(),
  type: z.enum(["liked", "rejected", "adjusted"]),
  detail: z.string().max(500).optional(),
  outfitId: z.string().optional(),
  outfit: z.record(z.unknown()).optional(), // outfit snapshot
});

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { sessionId, type, detail, outfitId, outfit } =
      FeedbackSchema.parse(body);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Save feedback
    const feedback = await prisma.feedback.create({
      data: {
        sessionId,
        type,
        detail: detail ?? null,
        outfitId: outfitId ?? null,
        outfit: outfit ? JSON.stringify(outfit) : null,
      },
    });

    // Mark session as complete
    await prisma.session.update({
      where: { id: sessionId },
      data: { completedStep: Math.max(session.completedStep, 6) },
    });

    // Async profile update (non-blocking — don't await for the response)
    updateStyleProfile(userId!, sessionId).catch((err) => {
      console.error("[profile-update]", err);
    });
    createStyleEvolutionSnapshot(userId!).catch((err) => {
      console.error("[style-evolution]", err);
    });

    return NextResponse.json({ id: feedback.id, ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[feedback]", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
