import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (command === "build" && (process.env.VERCEL === "1" || env.VERCEL === "1")) {
    const apiUrl = (process.env.VITE_API_URL ?? env.VITE_API_URL ?? "").trim();
    // Vercel's vercel.json forwards same-origin API requests to Render.
    let valid = apiUrl.replace(/\/+$/, "") === "/api";
    try {
      const url = new URL(apiUrl);
      valid = url.protocol === "https:" && url.pathname.replace(/\/+$/, "") === "/api";
    } catch {
      // The /api relative URL is supported by the Vercel rewrite above.
    }
    if (!valid) {
      throw new Error(
        "Set VITE_API_URL to /api (forwarded to Render by vercel.json) or your backend's full HTTPS URL ending in /api, then redeploy. API_PROXY_TARGET only applies to local development.",
      );
    }
  }
  return {
    plugins: [react()],
    build: {
      rollupOptions: { output: { manualChunks: { charts: ["recharts"] } } },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: env.API_PROXY_TARGET
        ? { "/api": { target: env.API_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
  };
});
