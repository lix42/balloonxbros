---
title: Migrate to Vite+
status: todo
deps: [pnpm, tanstack-start]
summary: vp migrate; scripts and CI on vp check/test/build
---
# Migrate to Vite+

## Goal

The toolchain runs on Vite+ (`vp`): dev, build, test, lint and format from one
dependency, with CI using the same commands.

## Design

- Run `vp migrate` (or `pnpm dlx --package=vite-plus@<version> vp migrate`). It
  updates dependencies, rewrites `vite` imports, merges tool config into
  `vite.config.ts` and rewrites scripts. Docs say most projects need manual
  fixes after.
- Make sure the Start, Cloudflare and Tailwind plugins still load from the
  merged config, and `wrangler` still deploys what `vp build` produces.
- Vitest is already v5; check the Vite+ Vitest compatibility notes anyway.
- Decide whether to adopt Oxlint/Oxfmt now (the repo has no linter or
  formatter today); if yes, the first format pass is a separate commit so
  the diff stays reviewable.
- Scripts: `check` → `vp check` (plus `tsc -b` if `vp check` doesn't
  typecheck), `test` → `vp test`, `build` → `vp build`. CI and `CLAUDE.md`
  follow.
- Skip `vp migrate`'s agent/editor files unless Li wants them.

## How to Verify

- `pnpm install`, then `vp check`, `vp test`, `vp build` pass; `vp dev` serves
  the site with local D1/R2.
- CI green on the PR; production deploy after merge works (smoke-load Home,
  submit nothing).
- `grep -rn '"vite"\|from "vite"' package.json vite.config.ts` shows only what
  Vite+ expects.
