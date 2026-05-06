import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08090d",
        panel: "#11131a",
        panelSoft: "#171a23",
        line: "rgba(255,255,255,0.10)",
        accent: "#64d2ff",
        mint: "#7ee7bf",
        violet: "#b9a7ff",
        danger: "#ff6b7a"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0,0,0,0.32)"
      }
    }
  },
  plugins: []
};

export default config;
