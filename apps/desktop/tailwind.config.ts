import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08090e",
        panel: "#13161f",
        panelSoft: "#1c2133",
        panelHigh: "#252c42",
        line: "rgba(255,255,255,0.10)",
        lineStrong: "rgba(255,255,255,0.16)",
        accent: "#3b82f6",
        accentText: "#60a5fa",
        mint: "#60a5fa",
        violet: "#60a5fa",
        warn: "#facc15",
        danger: "#f87171",
        electric: "#3b82f6",
        "electric-text": "#60a5fa",
        obsidian: {
          900: "#08090e",
          800: "#13161f",
          700: "#1c2133",
          600: "#252c42"
        }
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0,0,0,0.32)",
        glow: "0 0 24px rgba(59,130,246,0.35)"
      }
    }
  },
  plugins: []
};

export default config;
