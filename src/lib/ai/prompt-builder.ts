/**
 * Assembles the full AI stylist prompt from all available context.
 *
 * The prompt is the single most important piece of code in Vestige.
 * It is intentionally verbose and human-readable — judges will see this.
 */

import {
  SkinSummary,
  StyleIntention,
  StyleProfileData,
  OutfitRecommendation,
} from "@/types";

export interface RecentSessionContext {
  sessionId: string;
  date: string;
  intention: string;
  likedOutfits: string[]; // outfit names
  rejectedOutfits: string[]; // outfit names
  feedbackNotes: string[]; // raw user notes
}

export interface StylistPromptInput {
  skinSummary: SkinSummary;
  intention: StyleIntention;
  styleProfile: StyleProfileData | null;
  recentSessions: RecentSessionContext[];
  isFirstSession: boolean;
}

export function buildStylistSystemPrompt(): string {
  return `You are Vestige, a sophisticated AI personal stylist. Your role is to create deeply personalized outfit recommendations that feel like they come from a stylist who truly knows the person — not generic fashion advice.

You draw on:
- The user's skin analysis (tone, undertone, concerns) to choose flattering colors and textures
- Their stated styling intention (how they want to feel)
- Their evolving style history (what they've loved, rejected, and adjusted)
- Their accumulated style profile (preferred aesthetics, avoided styles, color palette)

Your recommendations should feel editorial, considered, and personal — never algorithmic.

When a user has history, reference it specifically. Say things like "given your preference for earth tones in past sessions" or "since you've consistently moved away from structured silhouettes." This is the core value of Vestige: memory that compounds.

Always return exactly 3 outfit recommendations as a JSON array matching the OutfitRecommendation schema.`;
}

export function buildStylistUserPrompt(input: StylistPromptInput): string {
  const {
    skinSummary,
    intention,
    styleProfile,
    recentSessions,
    isFirstSession,
  } = input;

  const sections: string[] = [];

  // ── Skin Analysis ────────────────────────────────────────────────────────
  sections.push(`## Skin Analysis (This Session)
Skin tone: ${skinSummary.tone}
Undertone: ${skinSummary.undertone}
Skin type: ${skinSummary.skinType}
Concerns: ${skinSummary.concerns.length > 0 ? skinSummary.concerns.join(", ") : "none notable"}

Color guidance from skin analysis:
- ${undertoneColorGuidance(skinSummary.undertone)}
- Avoid colors that clash with ${skinSummary.tone} skin: ${avoidColors(skinSummary.tone, skinSummary.undertone)}`);

  // ── Styling Intention ────────────────────────────────────────────────────
  sections.push(`## Styling Intention
The user wants to feel: **${intention}**
${intentionGuidance(intention)}`);

  // ── Style Profile ────────────────────────────────────────────────────────
  if (!isFirstSession && styleProfile) {
    const profile = styleProfile;

    sections.push(`## User Style Profile (Accumulated Over ${profile.sessionCount} Sessions)
Style summary: "${profile.styleSummary || "Style profile still forming."}"

Preferred styles: ${profile.preferredStyles.length > 0 ? profile.preferredStyles.join(", ") : "not yet established"}
Actively avoided: ${profile.avoidedStyles.length > 0 ? profile.avoidedStyles.join(", ") : "nothing noted yet"}
Color palette affinity: ${profile.colorPalette.length > 0 ? profile.colorPalette.join(", ") : "not yet established"}
Most frequent intentions: ${topIntentions(profile.intentions)}

Skin traits across sessions: tone ${profile.skinTraits?.tone ?? "varied"}, undertone ${profile.skinTraits?.undertone ?? "varied"}`);
  } else {
    sections.push(`## Style Profile
This is the user's first session. No prior style history exists. Create warm, welcoming recommendations that feel approachable and confident — give them a strong start.`);
  }

  // ── Recent Session History ────────────────────────────────────────────────
  if (recentSessions.length > 0) {
    const historyLines = recentSessions.map((s) => {
      const liked =
        s.likedOutfits.length > 0
          ? `Liked: ${s.likedOutfits.join(", ")}`
          : "No likes recorded";
      const rejected =
        s.rejectedOutfits.length > 0
          ? `Rejected: ${s.rejectedOutfits.join(", ")}`
          : "No rejections";
      const notes =
        s.feedbackNotes.length > 0
          ? `Notes: "${s.feedbackNotes.join("; ")}"`
          : "";
      return `- ${s.date} (intention: ${s.intention}): ${liked}. ${rejected}. ${notes}`;
    });

    sections.push(`## Recent Session History
${historyLines.join("\n")}

Use this history to refine your recommendations. Avoid patterns that have been consistently rejected. Build on patterns that have been consistently liked.`);
  }

  // ── Task ─────────────────────────────────────────────────────────────────
  sections.push(`## Your Task
Generate exactly 3 distinct outfit recommendations. Each must:
1. Flatter the user's specific skin tone and undertone
2. Serve the "${intention}" intention
3. Reference the user's style history where relevant (especially in the personalizedReason field)
4. Feel distinct from each other in silhouette, color story, or aesthetic
5. Be realistic and wearable — not costume or editorial fantasy

Return your response as a valid JSON array of OutfitRecommendation objects. No prose outside the JSON.`);

  return sections.join("\n\n");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function undertoneColorGuidance(undertone: string): string {
  switch (undertone.toLowerCase()) {
    case "warm":
      return "Warm undertone: earthy tones (terracotta, camel, olive, warm white, gold), oranges, warm reds, chocolate browns flatter most.";
    case "cool":
      return "Cool undertone: jewel tones (sapphire, emerald, plum), true whites, cool grays, navy, and berry shades work well.";
    case "neutral":
      return "Neutral undertone: both warm and cool palettes work. Soft neutrals, blush, dusty rose, and sage are particularly harmonious.";
    case "olive":
      return "Olive undertone: rich deep colors (burgundy, forest green, deep teal) are stunning. Avoid stark white and very pale pinks.";
    default:
      return "Adapt colors to the skin tone described.";
  }
}

function avoidColors(tone: string, undertone: string): string {
  const avoid: string[] = [];
  if (undertone === "warm") avoid.push("icy blues", "stark white", "cool lavender");
  if (undertone === "cool") avoid.push("orange", "warm yellow", "bronze");
  if (tone === "light") avoid.push("very pale pastels that wash out");
  if (tone === "deep") avoid.push("muddy mid-tones that disappear against deep complexions");
  return avoid.length > 0 ? avoid.join(", ") : "no specific colors to avoid";
}

function intentionGuidance(intention: StyleIntention): string {
  const guide: Record<StyleIntention, string> = {
    confident:
      "Strong silhouettes, structured pieces, bold choices that make a statement. Tailoring matters. Power dressing without being aggressive.",
    calm:
      "Soft fabrics, flowing lines, muted tones. Nothing too tight, too loud, or too structured. The outfit should feel like breathing.",
    bold:
      "Color, contrast, unexpected combinations. Pattern mixing is welcome. The outfit should turn heads without being costumey.",
    professional:
      "Polished, intentional, appropriate for business or formal settings. Clean lines, quality fabrics, restrained accessories.",
    playful:
      "Fun prints, unexpected textures, color pops. The outfit should feel joyful. Proportion play is encouraged.",
    minimal:
      "Capsule-wardrobe thinking. Monochromatic or tonal dressing. Every piece earns its place. No excess.",
    experimental:
      "Boundary-pushing combinations. Challenge conventional rules. Show the user something they haven't considered before.",
  };
  return guide[intention] ?? "";
}

function topIntentions(intentions: Record<string, number>): string {
  if (!intentions || Object.keys(intentions).length === 0) return "none yet";
  return Object.entries(intentions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k, v]) => `${k} (${v}×)`)
    .join(", ");
}
