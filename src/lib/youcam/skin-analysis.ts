/**
 * YouCam Skin Analysis API client.
 *
 * Docs: https://developer.youcam.com/skin-analysis
 *
 * The real endpoint shape is filled in below. If the actual API differs,
 * only this file needs updating — the rest of the app uses SkinSummary.
 */

import { SkinAnalysisRaw, SkinSummary } from "@/types";

export interface SkinAnalysisInput {
  imageBase64: string; // base64-encoded JPEG / PNG, no data URI prefix
  imageType?: "jpeg" | "png";
}

export class SkinAnalysisError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "SkinAnalysisError";
  }
}

export async function analyzeSkin(
  input: SkinAnalysisInput
): Promise<{ raw: SkinAnalysisRaw; summary: SkinSummary }> {
  const apiKey = process.env.YOUCAM_SKIN_API_KEY;
  const apiUrl = process.env.YOUCAM_SKIN_API_URL;

  if (!apiKey || !apiUrl) {
    // In development / demo mode, return realistic mock data
    return mockSkinAnalysis();
  }

  const response = await fetch(`${apiUrl}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Client": "vestige/1.0",
    },
    body: JSON.stringify({
      image: input.imageBase64,
      image_type: input.imageType ?? "jpeg",
      features: [
        "skin_tone",
        "undertone",
        "skin_type",
        "acne",
        "dark_circles",
        "wrinkles",
        "pores",
        "texture",
        "redness",
        "spots",
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new SkinAnalysisError(
      `YouCam Skin API error ${response.status}: ${text}`,
      response.status
    );
  }

  const raw = (await response.json()) as SkinAnalysisRaw;
  const summary = extractSummary(raw);
  return { raw, summary };
}

/**
 * Convert the verbose API response into the compact SkinSummary
 * the AI stylist and UI consume.
 */
function extractSummary(raw: SkinAnalysisRaw): SkinSummary {
  const d = raw.data ?? {};
  const attrs = d.attributes ?? {};

  // Map score ranges to concern labels
  const concerns: string[] = [];
  const thresholds: Record<string, string> = {
    acne: "acne",
    dark_circles: "dark circles",
    wrinkles: "fine lines",
    pores: "enlarged pores",
    redness: "redness",
    spots: "dark spots",
    texture: "uneven texture",
  };
  for (const [key, label] of Object.entries(thresholds)) {
    if (attrs[key] !== undefined && attrs[key] > 0.4) {
      concerns.push(label);
    }
  }

  return {
    tone: d.skinTone ?? "medium",
    undertone: d.undertone ?? "neutral",
    skinType: d.skinType ?? "combination",
    concerns,
    rawAttributes: attrs,
  };
}

/**
 * Realistic mock returned when API keys are absent (dev / demo mode).
 * Simulates a warm-toned medium complexion.
 */
function mockSkinAnalysis(): { raw: SkinAnalysisRaw; summary: SkinSummary } {
  const raw: SkinAnalysisRaw = {
    status: 200,
    message: "success",
    data: {
      skinTone: "medium",
      undertone: "warm",
      skinType: "combination",
      concerns: ["uneven texture", "dark spots"],
      attributes: {
        acne: 0.12,
        dark_circles: 0.38,
        wrinkles: 0.08,
        pores: 0.45,
        redness: 0.15,
        spots: 0.52,
        texture: 0.48,
      },
    },
  };
  return { raw, summary: extractSummary(raw) };
}
