// ── YouCam Skin Analysis ──────────────────────────────────────────────────────

export interface SkinAnalysisRaw {
  skinAnalysis: unknown;
  facialColorAnalysis: unknown;
}

export interface SkinSummary {
  tone: string;
  toneColor?: string;
  skinLab: LabColor | null;
  undertone: string;
  skinType: string;
  concerns: string[];
  concernScores: Record<string, number>;
  rawAttributes: Record<string, number>;
}

export interface SkinConcernChange {
  key: string;
  label: string;
  previousScore: number;
  currentScore: number;
  deltaPercentagePoints: number;
  relativePercentageChange: number | null;
}

export interface SkinTrendObservation {
  capturedAt: string;
  score: number;
}

export interface SkinTrendSignal {
  key: string;
  label: string;
  firstScore: number;
  previousScore: number;
  currentScore: number;
  deltaPercentagePoints: number;
  relativePercentageChange: number | null;
  observations: SkinTrendObservation[];
}

export interface SkinAnalysisComparison {
  previousCapturedAt: string;
  changes: SkinConcernChange[];
  trajectory: SkinTrendSignal[];
}

export interface LabColor {
  l: number;
  a: number;
  b: number;
}

export interface SkinPassport {
  version: 1;
  capturedAt: string;
  tone: string;
  toneColor: string;
  skinType: string;
  skinLab: LabColor;
  concerns: Record<string, number>;
}

// ── YouCam VTO ────────────────────────────────────────────────────────────────

export interface VtoRequest {
  userPhotoUrl?: string;
  userPhotoBase64?: string;
  userPhotoType?: "image/jpeg" | "image/png";
  garmentImage?: Uint8Array;
  garmentImageType?: "image/jpeg" | "image/png";
  garmentImageUrl?: string;
  garmentCategory: string; // "top" | "bottom" | "dress" | "outerwear"
}

export interface VtoResponse {
  tryOnImageUrl: string;
  status: string;
}

// ── AI Stylist ────────────────────────────────────────────────────────────────

export type StyleIntention =
  | "confident"
  | "calm"
  | "bold"
  | "professional"
  | "playful"
  | "minimal"
  | "experimental";

export interface GarmentItem {
  category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory";
  name: string;
  description: string;
  color: string;
  imageSearchQuery?: string;
  garmentImageUrl?: string;
  garmentId?: string;
  colorHex?: string;
  brand?: string;
  productUrl?: string;
  price?: number;
  currency?: string;
  attributes?: {
    tone?: string | null;
    silhouette?: string | null;
    formality?: string | null;
    style?: string | null;
    texture?: string | null;
    materials?: string[];
  };
}

export interface OutfitRecommendation {
  id: string;
  name: string;
  description: string;
  items: GarmentItem[];
  colorPalette: string[];
  intention: string;
  personalizedReason: string;
  confidence: number; // 0–1
}

// ── Style Profile ─────────────────────────────────────────────────────────────

export interface SkinTraits {
  tone: string;
  undertone: string;
  skinType: string;
  concerns: string[];
}

export interface StyleProfileData {
  skinTraits: SkinTraits | null;
  preferredStyles: string[];
  avoidedStyles: string[];
  intentions: Record<string, number>;
  colorPalette: string[];
  styleSummary: string;
  sessionCount: number;
}

export interface StyleEvolutionEntry {
  id: string;
  snapshotAt: string;
  summary: string;
  traits: StyleProfileData;
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface SessionData {
  id: string;
  userId: string;
  createdAt: string;
  intention: string | null;
  skinSummary: SkinSummary | null;
  recommendations: OutfitRecommendation[] | null;
  selectedOutfit: OutfitRecommendation | null;
  tryOnImageUrl: string | null;
  completedStep: number;
  photoUrl: string | null;
}

export interface FeedbackData {
  type: "liked" | "rejected" | "adjusted";
  detail?: string;
  outfitId?: string;
  outfit?: OutfitRecommendation;
}
