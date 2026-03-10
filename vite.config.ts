import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Security Headers Configuration
 * Protects against common web vulnerabilities
 */
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=(), camera=(), payment=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://maps.googleapis.com https://mts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https: wss: wss://*.supabase.co https://*.supabase.co https://firebaseremoteconfig.googleapis.com https://cesium.com https://*.cesium.com https://api.mapbox.com https://tiles.openstreetmap.org https://maps.googleapis.com https://mts.googleapis.com https://mts1.googleapis.com https://mts2.googleapis.com https://mts3.googleapis.com https://mts4.googleapis.com https://mts5.googleapis.com https://mts6.googleapis.com https://mts7.googleapis.com https://fcm.googleapis.com https://dev.virtualearth.net http://dev.virtualearth.net; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Powered-By': '',
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: securityHeaders,
    hmr: {
      host: 'localhost',
      port: 8080,
      protocol: 'ws',
    },
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-dom/client": "react-dom/client",
      "react-dom": "react-dom",
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },

  optimizeDeps: {
    force: true,
    exclude: [
      "@radix-ui/react-tabs",
      "html5-qrcode",
    ],
  },

  build: {
    // Optimize for mobile: smaller chunks, better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging in production
        pure_funcs: ['console.log'], // Remove console.log in production
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    // Increase chunk size warning threshold for mobile
    chunkSizeWarningLimit: 1000,
    // Generate source maps for production debugging
    sourcemap: false,
    // Optimize chunks for mobile
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-avatar",
          ],
          "vendor-forms": ["react-hook-form"],
          "vendor-maps": ["leaflet"],
          "vendor-utils": ["date-fns", "sonner"],
        },
        // Optimize bundle names
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/chunk-[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|gif|svg/.test(ext)) {
            return `images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          } else if (ext === 'css') {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
}));