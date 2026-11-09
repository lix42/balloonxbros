import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

// Written by tools, not by hand: never format or lint them.
const generated = [
  "dist/**",
  ".wrangler/**",
  "src/routeTree.gen.ts", // TanStack Router
  "worker/worker-configuration.d.ts", // wrangler types
  "pnpm-lock.yaml",
];
// Kept by the tasks CLI (docs/TASKS.md is rendered from the task files).
const tasksCli = ["docs/TASKS.md", "docs/tasks/**", "docs/progress.md"];

export default defineConfig({
  fmt: { ignorePatterns: [...generated, ...tasksCli] },
  lint: {
    ignorePatterns: generated,
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  plugins: lazyPlugins(() => [
    // The Worker (src/server.ts) runs in Vite's SSR environment.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    // React's plugin must come after Start's.
    react(),
  ]),
});
