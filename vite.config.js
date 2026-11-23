import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (command === "build" && (process.env.VERCEL === "1" || env.VERCEL === "1")) {
    const apiUrl = (process.env.VITE_API_URL ?? env.VITE_API_URL ?? "").trim();
    let valid = false;
    try {
      const url = new URL(apiUrl);
      valid = url.protocol === "https:" && url.pathname.replace(/\/+$/, "") === "/api";
    } catch {
      // Relative URLs use the frontend host, which has no API in this deployment.
    }
    if (!valid) {
      throw new Error(
        "Set VITE_API_URL in this Vercel project's environment variables to your Render backend's full HTTPS URL ending in /api, then redeploy. The local /api proxy and API_PROXY_TARGET do not run on Vercel.",
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
