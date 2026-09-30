"use client";

import { create } from "zustand";
import { SkinSummary, OutfitRecommendation, StyleIntention } from "@/types";

interface SessionStore {
  sessionId: string | null;
  photoFile: File | null;
  photoPreview: string | null;
  skinSummary: SkinSummary | null;
  intention: StyleIntention | null;
  recommendations: OutfitRecommendation[];
  selectedOutfit: OutfitRecommendation | null;
  tryOnImageUrl: string | null;

  setSessionId: (id: string) => void;
  setPhoto: (file: File, preview: string) => void;
  setSkinSummary: (s: SkinSummary) => void;
  setIntention: (i: StyleIntention) => void;
  setRecommendations: (r: OutfitRecommendation[]) => void;
  setSelectedOutfit: (o: OutfitRecommendation) => void;
  setTryOnImageUrl: (url: string) => void;
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

  setSessionId: (id) => set({ sessionId: id }),
  setPhoto: (file, preview) => set({ photoFile: file, photoPreview: preview }),
  setSkinSummary: (s) => set({ skinSummary: s }),
  setIntention: (i) => set({ intention: i }),
  setRecommendations: (r) => set({ recommendations: r }),
  setSelectedOutfit: (o) => set({ selectedOutfit: o }),
  setTryOnImageUrl: (url) => set({ tryOnImageUrl: url }),
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
    }),
}));
