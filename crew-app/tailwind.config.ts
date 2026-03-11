import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        fold: "280px",      // 폴드 접힌 상태
        mobile: "360px",    // 일반 모바일
        "mobile-lg": "412px", // 큰 모바일
        "fold-open": "768px", // 폴드 펼친 상태
        tablet: "1024px",
      },
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        secondary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top": "env(safe-area-inset-top)",
      },
      keyframes: {
        "heart-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "15%": { transform: "scale(1.3)", opacity: "1" },
          "30%": { transform: "scale(0.95)", opacity: "1" },
          "45%": { transform: "scale(1.05)", opacity: "1" },
          "60%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "0" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.05)" },
        },
        rainbow: {
          "0%": { color: "#ff0000" },
          "16%": { color: "#ff8800" },
          "33%": { color: "#ffff00" },
          "50%": { color: "#00ff00" },
          "66%": { color: "#0088ff" },
          "83%": { color: "#8800ff" },
          "100%": { color: "#ff0000" },
        },
        flame: {
          "0%, 100%": { textShadow: "0 0 4px #ff4500, 0 0 8px #ff6347" },
          "50%": { textShadow: "0 0 8px #ff4500, 0 0 16px #ff6347, 0 -4px 12px #ffa500" },
        },
        glow: {
          "0%, 100%": { textShadow: "0 0 4px currentColor, 0 0 8px currentColor" },
          "50%": { textShadow: "0 0 8px currentColor, 0 0 16px currentColor, 0 0 24px currentColor" },
        },
        neon: {
          "0%, 100%": { textShadow: "0 0 4px #fff, 0 0 8px #fff, 0 0 12px var(--neon-color, #0ff), 0 0 20px var(--neon-color, #0ff)" },
          "50%": { textShadow: "0 0 2px #fff, 0 0 4px #fff, 0 0 8px var(--neon-color, #0ff), 0 0 12px var(--neon-color, #0ff)" },
        },
        gradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        "heart-pop": "heart-pop 0.8s ease-out forwards",
        sparkle: "sparkle 1.5s ease-in-out infinite",
        rainbow: "rainbow 3s linear infinite",
        flame: "flame 1.5s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite",
        neon: "neon 2s ease-in-out infinite",
        gradient: "gradient 3s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
