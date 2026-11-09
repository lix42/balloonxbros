import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vite-plus";

const here = (path: string) => join(dirname(fileURLToPath(import.meta.url)), path);

// Every test runs inside workerd with the Worker from wrangler.jsonc and local
// D1/R2. Secrets get test values; RESEND_API_KEY stays unset, so no mail is sent.
export default defineConfig(async () => ({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: here("wrangler.jsonc") },
      // Tests call worker/service.ts directly; Start's server entry (the real
      // main) needs Start's Vite plugin to build, so give the pool a stub.
      main: here("tests/worker.ts"),
      miniflare: {
        bindings: {
          ADMIN_PASSWORD: "test-password",
          SESSION_SECRET: "test-session-secret",
          TEST_MIGRATIONS: await readD1Migrations(here("migrations")),
        },
      },
    }),
  ],
  test: {
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/apply-migrations.ts"],
  },
}));
