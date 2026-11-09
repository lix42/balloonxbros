---
title: Switch to pnpm
status: done
deps: []
summary: pnpm lockfile, packageManager, CI, docs
done: "2026-11-08 #7"
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
  explicitly rather than hoisting.
- Settings live in `pnpm-workspace.yaml` (pnpm 12 reads only auth and
  registry settings from `.npmrc`): `allowBuilds` lets only the packages that need install
  scripts run them (`esbuild`, `workerd`), and `engineStrict` replaces
  `.npmrc`'s `engine-strict`.
- CI (`.github/workflows/deploy.yml`): `corepack enable pnpm` after
  `actions/setup-node` (keep `node-version-file: .nvmrc`), as in the nc repo.
  No `pnpm/action-setup` and no `cache:`: setup-node's pnpm cache needs pnpm
  on PATH before it runs. Then `pnpm install --frozen-lockfile`,
  `pnpm run …`, `pnpm exec wrangler …`.
- Update the `npm run …` commands in `CLAUDE.md`, `README.md` and open task
  specs. Finished task specs and the progress log stay as written.

## How to Verify

- Clean clone: `pnpm install && pnpm run check && pnpm run build` pass;
  `pnpm run dev` serves the site with local D1/R2.
- The PR's CI run is green; after merge the deploy job succeeds.
- No `package-lock.json` remains; `grep -rnE "(^|[^p])npm (run|ci)|npx " CLAUDE.md README.md docs/tasks .github`
  finds nothing outside finished task specs and this file.
