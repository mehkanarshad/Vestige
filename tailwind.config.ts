import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vestige: {
          // Foundation — warm neutral scale
          cream:      "#F8F4EE",
          parchment:  "#EFE8DC",
          sand:       "#E0D3C0",
          stone:      "#B0A090",
          bark:       "#857060",
          umber:      "#58463A",
          charcoal:   "#2A1F18",
          ink:        "#1A1714",
          // Accent — one restrained warm gold
          accent:     "#B8924A",
          "accent-lt":"#D4AF72",
          // Semantic tones
          sage:       "#7A8C76",
          blush:      "#C07870",
          white:      "#FEFCF9",
          // Legacy aliases — keep existing pages building
          espresso:   "#2A1F18",  // → charcoal
          gold:       "#B8924A",  // → accent
          "gold-light":"#D4AF72", // → accent-lt
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans:  ["var(--font-sans)",  "DM Sans", "system-ui", "sans-serif"],
      },
      // Explicit font sizes keep Tailwind's JIT from purging them
      fontSize: {
        "display-2xl": ["clamp(3.25rem,7vw,5.75rem)", { lineHeight: "1.02", letterSpacing: "-0.02em" }],
        "display-xl":  ["clamp(2.5rem,5vw,4.25rem)",  { lineHeight: "1.06", letterSpacing: "-0.02em" }],
        "display-lg":  ["clamp(1.875rem,3.5vw,3rem)",  { lineHeight: "1.1",  letterSpacing: "-0.015em" }],
        "display-md":  ["clamp(1.375rem,2.25vw,2rem)", { lineHeight: "1.18", letterSpacing: "-0.01em" }],
        "display-sm":  ["clamp(1.125rem,1.75vw,1.5rem)",{ lineHeight: "1.25", letterSpacing: "-0.005em" }],
        "body-xl":     ["1.125rem",   { lineHeight: "1.75" }],
        "body-lg":     ["1.0625rem",  { lineHeight: "1.75" }],
        "body-md":     ["0.9375rem",  { lineHeight: "1.65" }],
        "body-sm":     ["0.8125rem",  { lineHeight: "1.6"  }],
        "body-xs":     ["0.75rem",    { lineHeight: "1.55" }],
        "label":       ["0.6875rem",  { lineHeight: "1",   letterSpacing: "0.14em" }],
        "label-sm":    ["0.625rem",   { lineHeight: "1",   letterSpacing: "0.16em" }],
      },
      spacing: {
        "18":  "4.5rem",
        "22":  "5.5rem",
        "26":  "6.5rem",
        "30":  "7.5rem",
        "34":  "8.5rem",
      },
      maxWidth: {
        "prose-sm": "52ch",
        "prose":    "66ch",
        "prose-lg": "76ch",
      },
      borderRadius: {
        none:    "0",
        sm:      "1px",
        DEFAULT: "2px",
        md:      "4px",
        lg:      "8px",
        full:    "9999px",
      },
      boxShadow: {
        lifted:   "0 1px 3px rgba(26,23,20,0.06), 0 4px 12px rgba(26,23,20,0.05)",
        card:     "0 1px 4px rgba(26,23,20,0.06), 0 8px 24px rgba(26,23,20,0.04)",
        elevated: "0 4px 20px rgba(26,23,20,0.10), 0 1px 4px rgba(26,23,20,0.06)",
        image:    "0 2px 16px rgba(26,23,20,0.12)",
      },
      transitionTimingFunction: {
        "out-expo":    "cubic-bezier(0.16,1,0.3,1)",
        "in-out-sine": "cubic-bezier(0.37,0,0.63,1)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up":         "fade-up  0.55s cubic-bezier(0.16,1,0.3,1) both",
        "fade-up-delay":   "fade-up  0.55s 0.12s cubic-bezier(0.16,1,0.3,1) both",
        "fade-up-delay2":  "fade-up  0.55s 0.24s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":         "fade-in  0.4s ease both",
        "scale-in":        "scale-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "shimmer":         "shimmer  2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
