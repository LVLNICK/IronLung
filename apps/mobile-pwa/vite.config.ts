import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: process.env.GITHUB_PAGES === "true" || mode === "github-pages" ? "/IronLung/" : "/",
  plugins: [react()],
  build: {
    target: "es2020"
  },
  server: {
    host: "0.0.0.0",
    port: 5174
  },
  preview: {
    host: "0.0.0.0",
    port: 4174
  }
}));
