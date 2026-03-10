import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Use a different base path when building for GitHub Pages so that
// the app works at https://ady-bhai.github.io/agent-ID-poc-SG/
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },
  base: isProd ? "/agent-ID-poc-SG/" : "/",
});
