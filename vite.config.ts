import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const startShim = path.resolve(__dirname, "src/lib/start-shim.ts");

const securityHeaders = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src 'self' https://www.google.com https://maps.google.com https://challenges.cloudflare.com; object-src 'none'; base-uri 'self';",
};

export default defineConfig({
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    tailwindcss(),
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@tanstack/react-start/server": startShim,
      "@tanstack/react-start": startShim,
    },
  },
});
