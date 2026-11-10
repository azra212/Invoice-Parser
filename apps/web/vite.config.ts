import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const webRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(webRoot, "../..")],
    },
    proxy: {
      "/api": "http://localhost:3000",
    },
    hmr: process.env.DISABLE_HMR !== "true",
  },
});
