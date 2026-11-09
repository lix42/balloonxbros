---
title: Switch to pnpm
status: todo
deps: []
summary: pnpm lockfile, packageManager, CI, docs
---
# Switch to pnpm

## Goal

The project installs, checks, builds and deploys with pnpm instead of npm,
locally and in CI.

## Design

- `pnpm import` (from `package-lock.json`) to keep resolved versions, then
  delete `package-lock.json` and commit `pnpm-lock.yaml`.
- Set `"packageManager": "pnpm@<version>"` in `package.json` (Corepack).
- If pnpm's strict `node_modules` exposes a missing direct dependency, add it
  explicitly rather than hoisting. pnpm 10 skips dependency build scripts by
  default; allow the ones that need them (e.g. `workerd`, `esbuild`) via
  `pnpm.onlyBuiltDependencies`.
- CI (`.github/workflows/deploy.yml`): `pnpm/action-setup`, `cache: pnpm`,
  `pnpm install --frozen-lockfile`, `pnpm run …`, `pnpm exec wrangler …`.
- Update the `npm run …` commands in `CLAUDE.md` and `docs/`.

## How to Verify

- Clean clone: `pnpm install && pnpm run check && pnpm run build` pass;
  `pnpm run dev` serves the site with local D1/R2.
- The PR's CI run is green; after merge the deploy job succeeds.
- No `package-lock.json` remains; `grep -rn "npm run\|npm ci" CLAUDE.md docs .github`
  finds nothing stale.
