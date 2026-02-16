import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * Security Headers Configuration
 * Protects against common web vulnerabilities
 */
const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection in older browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Restrict browser features
  'Permissions-Policy': 'geolocation=(self), microphone=(), camera=(), payment=()',
  
  // Content Security Policy - strict but allows necessary APIs
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://firebaseremoteconfig.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  
  // HSTS - Force HTTPS in production (max-age in seconds)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Prevent information leakage
  'X-Powered-By': '', // Remove header
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
    },
  },
  define: {
    // Ensure secure defaults in production
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    // Optimize chunk splitting for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy dependencies into separate chunks for better caching
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tooltip', '@radix-ui/react-avatar'],
          'vendor-charts': ['recharts'],
          'vendor-forms': ['react-hook-form'],
        },
      },
    },
  },
}));
