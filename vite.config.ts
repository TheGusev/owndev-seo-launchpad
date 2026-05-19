import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import sitemapPlugin from "./vite-plugin-sitemap";

// https://vitejs.dev/config/
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
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul')) return 'vendor-radix';
            if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('docx')) return 'vendor-docx';
            if (id.includes('xlsx') || id.includes('file-saver')) return 'vendor-files';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@tanstack')) return 'vendor-query';
            return 'vendor';
          }
          if (id.includes('src/fonts/roboto-base64')) return 'fonts-roboto';
          if (id.includes('src/lib/proBlueprintSections')) return 'pro-blueprint';
          if (id.includes('src/lib/generateSiteFormulaPro')) return 'pro-blueprint';
        }
      }
    }
  }
}));
