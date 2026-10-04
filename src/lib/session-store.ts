"use client";

import { create } from "zustand";
import { SkinSummary, OutfitRecommendation, StyleIntention } from "@/types";

export interface TryOnGarment {
  garmentId: string;
  imageUrl: string;
  name: string;
  category: "top" | "bottom" | "dress" | "outerwear";
}

interface SessionStore {
  sessionId: string | null;
  photoFile: File | null;
  photoPreview: string | null;
  skinSummary: SkinSummary | null;
  intention: StyleIntention | null;
  recommendations: OutfitRecommendation[];
  selectedOutfit: OutfitRecommendation | null;
  tryOnImageUrl: string | null;
  tryOnGarment: TryOnGarment | null;

  setSessionId: (id: string) => void;
  setPhoto: (file: File, preview: string) => void;
  setSkinSummary: (s: SkinSummary) => void;
  setIntention: (i: StyleIntention) => void;
  setRecommendations: (r: OutfitRecommendation[]) => void;
  setSelectedOutfit: (o: OutfitRecommendation) => void;
  setTryOnImageUrl: (url: string) => void;
  setTryOnGarment: (garment: TryOnGarment | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  photoFile: null,
  photoPreview: null,
  skinSummary: null,
  intention: null,
  recommendations: [],
  selectedOutfit: null,
  tryOnImageUrl: null,
  tryOnGarment: null,

  setSessionId: (id) => set({ sessionId: id }),
  setPhoto: (file, preview) => set({ photoFile: file, photoPreview: preview }),
  setSkinSummary: (s) => set({ skinSummary: s }),
  setIntention: (i) => set({ intention: i }),
  setRecommendations: (r) => set({ recommendations: r }),
  setSelectedOutfit: (o) => set({ selectedOutfit: o }),
  setTryOnImageUrl: (url) => set({ tryOnImageUrl: url }),
  setTryOnGarment: (garment) => set({ tryOnGarment: garment }),
  reset: () =>
    set({
      sessionId: null,
      photoFile: null,
      photoPreview: null,
      skinSummary: null,
      intention: null,
      recommendations: [],
      selectedOutfit: null,
      tryOnImageUrl: null,
      tryOnGarment: null,
    }),
}));
