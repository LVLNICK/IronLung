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
        line: "rgba(255,255,255,0.12)",
        electric: "#3b82f6",
        electricText: "#60a5fa",
        warn: "#facc15",
        danger: "#f87171"
      },
      boxShadow: {
        glow: "0 0 24px rgba(59,130,246,0.30)"
      }
    }
  },
  plugins: []
};

export default config;
