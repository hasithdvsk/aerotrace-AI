import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        obsidian: {
          950: "#030712",
          900: "#0B0F17",
          800: "#111827",
          700: "#1F2937",
        },
        "emerald-cyber": {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        "cyan-electric": {
          400: "#22D3EE",
          500: "#06B6D4",
        },
        "crimson-neon": {
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
        },
        "violet-satellite": {
          400: "#A78BFA",
          500: "#8B5CF6",
        },
      },
      boxShadow: {
        "glow-emerald": "0 0 20px -3px rgba(16, 185, 129, 0.3)",
        "glow-crimson": "0 0 20px -3px rgba(244, 63, 94, 0.3)",
        "glow-violet": "0 0 20px -3px rgba(139, 92, 246, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
