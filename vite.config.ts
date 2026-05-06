import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const proxyTarget = process.env.VITE_PROXY_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ["3f7896e78c63.ngrok-free.app", ".ngrok-free.app", "localhost", ],
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
      "/hubs": {
        target: proxyTarget,
        changeOrigin: true,
        ws: true,
      },
      "^/cam-\\d+/.*": {
        target: "http://localhost:8889",
        changeOrigin: true,
        ws: false,
      },
      "^/cam-\\d+/(whep|whip)$": {
        target: "http://localhost:8889",
        changeOrigin: true,
        ws: false,
      },
    },
  },
});
