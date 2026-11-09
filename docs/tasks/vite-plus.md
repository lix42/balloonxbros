---
title: Migrate to Vite+
status: done
deps: [pnpm, tanstack-start]
summary: vp migrate; scripts and CI on vp check/test/build
done: "2026-11-08 #9"
---
# Migrate to Vite+

## Goal

The toolchain runs on Vite+ (`vp`): dev, build, test, lint and format from one
dependency, with CI using the same commands.

## Design

- `pnpm dlx --package=vite-plus@<version> vp migrate --no-interactive
  --no-agent --no-editor --no-hooks`. It adds `vite-plus`, pins `vite` (to
  `@voidzero-dev/vite-plus-core`) and `vitest` through a `catalog` and
  `overrides` in `pnpm-workspace.yaml`, rewrites `vite`/`vitest` imports to
  `vite-plus`, adds `fmt`/`lint` blocks to `vite.config.ts`, wraps the plugins
  in `lazyPlugins`, and rewrites `dev`/`build`/`preview`/`test` scripts. No
  commit hooks or agent/editor files.
- The Start, Cloudflare and React plugins still load from the merged config,
  and `wrangler` deploys what `vp build` produces.
- Adopt Oxlint and Oxfmt (the repo had neither): lint is type-aware with
  `typeCheck`, so `vp check` also type-checks. The repo-wide format pass is
  its own commit so the migration diff stays reviewable. Generated files
  (`src/routeTree.gen.ts`, `worker/worker-configuration.d.ts`, `dist`,
  `.wrangler`, the lockfile) and the tasks-CLI docs (`docs/TASKS.md`,
  `docs/tasks/**`, `docs/progress.md`) are excluded, since tools write them.
- Scripts: `check` → `vp check && tsc -b && vp test run`, `typecheck` →
  `tsc -b`, `fix` → `vp check --fix`. `vp check` does type-check (an injected
  `document` in `worker/` fails it), but it checks a file under only one
  tsconfig: `shared/` sits in the app, worker and tests projects and is
  checked only with the DOM lib, so `document` in `shared/` passes `vp check`
  and fails `tsc -b`. The Worker bundles `shared/`, so `tsc -b` stays. CI
  already calls `pnpm run check` and `pnpm run build`.

## How to Verify

- `pnpm install`, then `vp check`, `vp test run`, `vp build` pass;
  `vp dev` serves the site with local D1/R2.
- CI green on the PR; production deploy after merge works (smoke-load Home,
  submit nothing).
- `grep -rn '"vite"\|from "vite"' package.json vite.config.ts` shows only what
  Vite+ expects.
