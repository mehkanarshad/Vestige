/**
 * Seed script — creates a demo account with pre-populated style history
 * so hackathon judges can log in immediately and see a rich profile.
 *
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@vestige.style";
const DEMO_PASSWORD = "vestige2026";
const DEMO_NAME = "Alex Chen";

// ── Seed data helpers ─────────────────────────────────────────────────────────

const SKIN_SUMMARY = {
  tone: "medium",
  undertone: "warm",
  skinType: "combination",
  concerns: ["dark spots", "uneven texture"],
  rawAttributes: {
    acne: 0.12,
    dark_circles: 0.38,
    spots: 0.52,
    texture: 0.48,
    redness: 0.15,
    wrinkles: 0.08,
    pores: 0.45,
  },
};

const MOCK_OUTFITS = [
  {
    id: "seed-outfit-1",
    name: "The Considered Edit",
    description:
      "A pared-back look built on clean lines and tonal dressing. The earthy warmth of camel and ivory complements warm undertones beautifully.",
    items: [
      { category: "top", name: "Relaxed linen shirt", description: "Oversized", color: "warm ivory", imageSearchQuery: "linen shirt ivory women" },
      { category: "bottom", name: "Wide-leg trousers", description: "High-waisted", color: "camel", imageSearchQuery: "wide leg trousers camel women" },
      { category: "shoes", name: "Pointed mule", description: "Kitten heel", color: "tan leather", imageSearchQuery: "kitten heel mule tan" },
    ],
    colorPalette: ["warm ivory", "camel", "tan"],
    intention: "Channels calm through restraint.",
    personalizedReason: "A strong starting point — understated but unmistakably considered.",
    confidence: 0.88,
  },
  {
    id: "seed-outfit-2",
    name: "Soft Authority",
    description:
      "Structured silhouette softened by drape. The longline blazer gives weight and intention while the bias-cut skirt balances the formality.",
    items: [
      { category: "outerwear", name: "Longline blazer", description: "Single button", color: "chocolate brown", imageSearchQuery: "longline blazer brown women" },
      { category: "bottom", name: "Silk bias-cut skirt", description: "Midi length", color: "burnt sienna", imageSearchQuery: "silk midi skirt sienna" },
      { category: "shoes", name: "Ankle boot", description: "Block heel", color: "dark brown", imageSearchQuery: "block heel ankle boot women" },
    ],
    colorPalette: ["chocolate brown", "burnt sienna", "dark brown"],
    intention: "Delivers professional confidence through structure.",
    personalizedReason: "Warm palette harmonises with your undertone from session analysis.",
    confidence: 0.84,
  },
  {
    id: "seed-outfit-3",
    name: "The Unexpected Quiet",
    description:
      "Monochromatic sage head to toe — a colour that reads as sophisticated calm.",
    items: [
      { category: "top", name: "Fitted turtleneck", description: "Second-skin", color: "sage green", imageSearchQuery: "fitted turtleneck sage women" },
      { category: "bottom", name: "Straight-cut trousers", description: "High-rise", color: "sage green", imageSearchQuery: "straight trousers sage women" },
      { category: "shoes", name: "Chunky loafer", description: "Minimal design", color: "white", imageSearchQuery: "chunky loafer white women" },
    ],
    colorPalette: ["sage green", "white", "gold"],
    intention: "Sage is a quietly powerful choice for calm.",
    personalizedReason: "Sage consistently appears in your liked palettes across sessions.",
    confidence: 0.91,
  },
];

const SEED_SESSIONS: Array<{
  intention: string;
  selectedOutfitIdx: number;
  feedbackType: "liked" | "rejected" | "adjusted";
  feedbackDetail: string;
  daysAgo: number;
}> = [
  {
    intention: "calm",
    selectedOutfitIdx: 0,
    feedbackType: "liked",
    feedbackDetail: "Love the palette but wanted something slightly more relaxed",
    daysAgo: 45,
  },
  {
    intention: "professional",
    selectedOutfitIdx: 1,
    feedbackType: "liked",
    feedbackDetail: "Perfect for the board meeting. The warm browns worked really well.",
    daysAgo: 30,
  },
  {
    intention: "minimal",
    selectedOutfitIdx: 2,
    feedbackType: "liked",
    feedbackDetail: "The monochromatic sage was unexpected but I ended up loving it.",
    daysAgo: 18,
  },
  {
    intention: "confident",
    selectedOutfitIdx: 0,
    feedbackType: "adjusted",
    feedbackDetail: "Great silhouette but the colors felt a bit muted for confident",
    daysAgo: 10,
  },
  {
    intention: "calm",
    selectedOutfitIdx: 2,
    feedbackType: "liked",
    feedbackDetail: "Sage again — it just works for me. Keep suggesting this palette.",
    daysAgo: 3,
  },
];

const STYLE_PROFILE = {
  skinTraits: SKIN_SUMMARY,
  preferredStyles: [
    "earth tones",
    "minimalist",
    "relaxed silhouette",
    "monochromatic",
    "structured tailoring",
  ],
  avoidedStyles: ["bold color", "pattern/print"],
  intentions: { calm: 3, professional: 2, minimal: 1, confident: 1 },
  colorPalette: [
    "warm ivory",
    "camel",
    "tan",
    "chocolate brown",
    "burnt sienna",
    "sage green",
    "white",
    "gold",
  ],
  styleSummary:
    "Gravitates toward clean, earth-toned minimalism — an understated confidence that speaks through fabric and silhouette rather than volume.",
  sessionCount: 5,
};

const EVOLUTION_SNAPSHOTS = [
  {
    daysAgo: 30,
    summary:
      "Early preference for warm neutrals and relaxed structure is beginning to emerge.",
  },
  {
    daysAgo: 10,
    summary:
      "A consistent pull toward earthy, pared-back dressing — calm intentionality over statement.",
  },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding demo account…");

  // Upsert demo user
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, name: DEMO_NAME },
    create: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      passwordHash,
    },
  });

  console.log(`  User: ${user.email} (${user.id})`);

  // Clear existing seed sessions for idempotent re-runs
  await prisma.feedback.deleteMany({
    where: { session: { userId: user.id } },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.styleEvolution.deleteMany({ where: { userId: user.id } });

  // Create sessions
  for (const s of SEED_SESSIONS) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - s.daysAgo);

    const outfit = MOCK_OUTFITS[s.selectedOutfitIdx];

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        createdAt,
        updatedAt: createdAt,
        intention: s.intention,
        skinAnalysisRaw: JSON.stringify({
          status: 200,
          message: "success",
          data: SKIN_SUMMARY,
        }),
        skinSummary: JSON.stringify(SKIN_SUMMARY),
        recommendations: JSON.stringify(MOCK_OUTFITS),
        selectedOutfit: JSON.stringify(outfit),
        tryOnImageUrl:
          "https://placehold.co/480x640/E8DDD0/3D2B1F?text=Try-On+Preview",
        completedStep: 6,
      },
    });

    await prisma.feedback.create({
      data: {
        sessionId: session.id,
        type: s.feedbackType,
        detail: s.feedbackDetail,
        outfitId: outfit.id,
        outfit: JSON.stringify(outfit),
        createdAt,
      },
    });

    console.log(
      `  Session: ${s.intention} / ${s.daysAgo}d ago → ${s.feedbackType}`
    );
  }

  // Upsert style profile
  await prisma.styleProfile.upsert({
    where: { userId: user.id },
    update: {
      skinTraits: JSON.stringify(STYLE_PROFILE.skinTraits),
      preferredStyles: JSON.stringify(STYLE_PROFILE.preferredStyles),
      avoidedStyles: JSON.stringify(STYLE_PROFILE.avoidedStyles),
      intentions: JSON.stringify(STYLE_PROFILE.intentions),
      colorPalette: JSON.stringify(STYLE_PROFILE.colorPalette),
      styleSummary: STYLE_PROFILE.styleSummary,
      sessionCount: STYLE_PROFILE.sessionCount,
    },
    create: {
      userId: user.id,
      skinTraits: JSON.stringify(STYLE_PROFILE.skinTraits),
      preferredStyles: JSON.stringify(STYLE_PROFILE.preferredStyles),
      avoidedStyles: JSON.stringify(STYLE_PROFILE.avoidedStyles),
      intentions: JSON.stringify(STYLE_PROFILE.intentions),
      colorPalette: JSON.stringify(STYLE_PROFILE.colorPalette),
      styleSummary: STYLE_PROFILE.styleSummary,
      sessionCount: STYLE_PROFILE.sessionCount,
    },
  });

  // Create evolution snapshots
  for (const snap of EVOLUTION_SNAPSHOTS) {
    const snapshotAt = new Date();
    snapshotAt.setDate(snapshotAt.getDate() - snap.daysAgo);
    await prisma.styleEvolution.create({
      data: {
        userId: user.id,
        snapshotAt,
        summary: snap.summary,
        traits: JSON.stringify(STYLE_PROFILE),
      },
    });
  }

  console.log("  Style profile and evolution snapshots created.");
  console.log("\nDemo account ready:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
