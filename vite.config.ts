import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import sitemapPlugin from "./vite-plugin-sitemap";

// https://vitejs.dev/config/
// PR-29: manualChunks из PR-25 убран целиком — он создавал нелинкуемые
// разрывы между чанками (createContext/forwardRef terjadi undefined на проде).
// Динамический импорт fonts/roboto-base64 в pdf-генераторах оставлен —
// он работает на уровне самих файлов, без manualChunks.
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), sitemapPlugin()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
}));
