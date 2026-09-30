// ── YouCam Skin Analysis ──────────────────────────────────────────────────────

export interface SkinAnalysisRaw {
  // Top-level YouCam API response shape (adapt to actual spec)
  status: number;
  message: string;
  data: SkinAnalysisData;
}

export interface SkinAnalysisData {
  skinTone?: string;           // e.g. "light", "medium", "deep"
  undertone?: string;          // e.g. "warm", "cool", "neutral"
  skinType?: string;           // e.g. "oily", "dry", "combination"
  concerns?: string[];         // e.g. ["dark circles", "uneven texture"]
  attributes?: Record<string, number>; // confidence scores
}

export interface SkinSummary {
  tone: string;
  undertone: string;
  skinType: string;
  concerns: string[];
  rawAttributes: Record<string, number>;
}

// ── YouCam VTO ────────────────────────────────────────────────────────────────

export interface VtoRequest {
  userPhotoUrl: string;
  garmentImageUrl: string;
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
  imageSearchQuery: string; // for VTO lookup
  garmentImageUrl?: string; // resolved URL for VTO
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
