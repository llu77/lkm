import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import hercules from "@usehercules/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem - core framework (loaded first)
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router')) {
            return 'react-vendor';
          }

          // Radix UI - all 26 packages in one chunk (shared UI components)
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }

          // Convex - backend communication
          if (id.includes('node_modules/convex')) {
            return 'convex-vendor';
          }

          // Charts - only for dashboard (lazy loaded with dashboard)
          if (id.includes('recharts')) {
            return 'charts';
          }

          // PDF Generation - heavy library, load only when needed
          if (id.includes('jspdf') || id.includes('html2canvas')) {
            return 'pdf-generator';
          }

          // Forms - react-hook-form + validation
          if (id.includes('react-hook-form') ||
              id.includes('@hookform') ||
              id.includes('zod')) {
            return 'forms';
          }

          // Icons - Lucide React (used across many pages)
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // Date utilities - date-fns
          if (id.includes('date-fns')) {
            return 'date-utils';
          }

          // UI utilities - class manipulation
          if (id.includes('node_modules/clsx') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'ui-utils';
          }

          // OIDC Authentication
          if (id.includes('oidc-client') || id.includes('react-oidc-context')) {
            return 'auth';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // More strict threshold
  },
  plugins: [react(), tailwindcss(), hercules()],
  resolve: {
    alias: {
      "@/convex": path.resolve(__dirname, "./convex"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
