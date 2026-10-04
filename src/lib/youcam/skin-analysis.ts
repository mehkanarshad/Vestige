import { SkinAnalysisRaw, SkinSummary } from "@/types";
import {
  createYouCamTask,
  uploadYouCamImage,
  waitForYouCamTask,
  YouCamApiError,
  YouCamTaskResult,
} from "./client";

export interface SkinAnalysisInput {
  image: Buffer;
}

export class SkinAnalysisError extends YouCamApiError {}

interface SkinAnalysisOutput {
  type?: string;
  region?: string;
  raw_score?: number;
  ui_score?: number;
  value?: unknown;
  skin_type?: unknown;
  label?: unknown;
}

export async function analyzeSkin(
  input: SkinAnalysisInput
): Promise<{ raw: SkinAnalysisRaw; summary: SkinSummary }> {
  const fileId = await uploadYouCamImage(input.image, "image/jpeg");
  const analysisPath = "/task/skin-analysis";
  const colorPath = "/task/skin-tone-analysis";
  const [analysisTaskId, colorTaskId] = await Promise.all([
    createYouCamTask(analysisPath, {
      src_file_id: fileId,
      dst_actions: [
        "acne",
        "dark_circle_v2",
        "wrinkle",
        "pore",
        "texture",
        "redness",
        "age_spot",
        "skin_type",
      ],
      format: "json",
    }),
    createYouCamTask(colorPath, {
      src_file_id: fileId,
      face_angle_strictness_level: "medium",
    }),
  ]);

  const [skinAnalysis, facialColorAnalysis] = await Promise.all([
    waitForYouCamTask(analysisPath, analysisTaskId, 25_000),
    waitForYouCamTask(colorPath, colorTaskId, 25_000),
  ]);

  const raw: SkinAnalysisRaw = { skinAnalysis, facialColorAnalysis };
  const summary = extractSummary(skinAnalysis, facialColorAnalysis);
  return { raw, summary };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function extractSummary(
  skinAnalysis: YouCamTaskResult,
  facialColorAnalysis: YouCamTaskResult
): SkinSummary {
  const analysisResults = asRecord(skinAnalysis.results);
  const colorResults = asRecord(facialColorAnalysis.results);
  const color = asRecord(colorResults.color);
  const output = Array.isArray(analysisResults.output)
    ? (analysisResults.output as SkinAnalysisOutput[])
    : [];
  const labels: Record<string, string> = {
    acne: "acne",
    dark_circle_v2: "dark circles",
    wrinkle: "fine lines",
    pore: "enlarged pores",
    texture: "uneven texture",
    redness: "redness",
    age_spot: "dark spots",
  };
  const rawAttributes: Record<string, number> = {};
  const concerns: string[] = [];

  for (const item of output) {
    if (!item.type || typeof item.raw_score !== "number") continue;
    const key = item.region ? `${item.type}_${item.region}` : item.type;
    rawAttributes[key] = item.raw_score;
    if (labels[item.type] && item.raw_score < 60 && !concerns.includes(labels[item.type])) {
      concerns.push(labels[item.type]);
    }
  }

  const skinTypeResult = output.find((item) => item.type === "skin_type");
  const skinTypeValues = [skinTypeResult?.skin_type, skinTypeResult?.value, skinTypeResult?.label];
  const skinType = skinTypeValues.find(
    (value): value is string =>
      typeof value === "string" &&
      /^(normal|oily|dry|combination)(\s|$)/i.test(value)
  );
  const toneColor = typeof color.skin_color === "string" ? color.skin_color : undefined;

  return {
    tone: toneColor ? classifyTone(toneColor) : "not assessed",
    toneColor,
    undertone: "not assessed",
    skinType: skinType ?? "not assessed",
    concerns,
    rawAttributes,
  };
}

function classifyTone(hex: string): string {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!match) return "detected";

  const channels = match.slice(1).map((channel) => parseInt(channel, 16) / 255);
  const luminance = channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);

  if (luminance >= 0.56) return "light";
  if (luminance >= 0.36) return "medium";
  if (luminance >= 0.2) return "deep";
  return "rich";
}
