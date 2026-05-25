import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import prerender from "vite-plugin-prerender";

const prerenderRoutes = [
  "/",
  "/car-detailing-baton-rouge",
  "/rv-detailing-baton-rouge",
  "/boat-detailing-baton-rouge",
  "/aircraft-detailing-baton-rouge",
  "/mobile-car-detailing-baton-rouge",
  "/ceramic-coating-baton-rouge",
  "/paint-correction-baton-rouge",
  "/interior-detailing-baton-rouge",
  "/exterior-detailing-baton-rouge",
  "/headlight-restoration-baton-rouge",
  "/odor-removal-baton-rouge",
  "/pet-hair-removal-baton-rouge",
  "/engine-bay-cleaning-baton-rouge",
  "/mobile-rv-detailing-baton-rouge",
  "/rv-oxidation-removal-baton-rouge",
  "/rv-interior-detailing-baton-rouge",
  "/rv-ceramic-coating-baton-rouge",
  "/rv-roof-cleaning-baton-rouge",
  "/mobile-boat-detailing-baton-rouge",
  "/boat-ceramic-coating-baton-rouge",
  "/gelcoat-restoration-baton-rouge",
  "/hull-cleaning-baton-rouge",
  "/pontoon-cleaning-baton-rouge",
  "/aircraft-cleaning-baton-rouge",
  "/aircraft-interior-detailing-baton-rouge",
  "/aircraft-paint-protection-baton-rouge",
  "/car-detailing-highland-road-baton-rouge",
  "/car-detailing-shenandoah-baton-rouge",
  "/car-detailing-gonzales-la",
  "/car-detailing-prairieville-la",
  "/car-detailing-denham-springs-la",
  "/car-detailing-walker-la",
  "/car-detailing-zachary-la",
  "/car-detailing-central-la",
  "/services",
  "/about",
  "/contact",
  "/reviews",
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" &&
      prerender({
        staticDir: path.join(__dirname, "dist"),
        routes: prerenderRoutes,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          supabase: ['@supabase/supabase-js'],
          tanstack: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
