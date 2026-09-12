import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo from /<repo>/; local dev stays at /.
  base: process.env.GITHUB_ACTIONS ? "/hackillinois-web-system-coding/" : "/",
});
