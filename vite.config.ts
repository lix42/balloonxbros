import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // The Worker (src/server.ts) runs in Vite's SSR environment.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    // React's plugin must come after Start's.
    react(),
  ],
});
