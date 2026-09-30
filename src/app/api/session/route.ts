import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/session-guard";

// POST /api/session — create a new styling session
export async function POST(_req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const session = await prisma.session.create({
    data: { userId: userId! },
  });

  return NextResponse.json({ id: session.id }, { status: 201 });
}

// GET /api/session — list user's sessions
export async function GET(_req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const sessions = await prisma.session.findMany({
    where: { userId: userId! },
    orderBy: { createdAt: "desc" },
    include: {
      feedback: { select: { type: true, detail: true, createdAt: true } },
    },
  });

  return NextResponse.json(sessions);
}
