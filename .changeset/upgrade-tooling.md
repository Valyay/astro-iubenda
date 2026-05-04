---
"astro-iubenda": minor
---

Upgrade tooling, runtime, and supply-chain hardening.

**Breaking for consumers**

- `engines.node` is now `>=22` (was `>=20`). Node 20 reached EOL on 2026-04-30; users still on it must upgrade.
- `engines.pnpm` is now `>=11` (was `>=10`).
- `peerDependencies.astro` now also accepts `^6.0.0`. Verified end-to-end against Astro 4.16, 5.18, and 6.2 with Playwright.

**Internal changes (no API impact)**

- TypeScript 5.9 → 6.0, Vite 7 → 8, tsup target `node18` → `node22`, tsconfig target `ES2021` → `ES2023`.
- Replaced ESLint + Prettier with oxlint + oxfmt.
- Replaced `rimraf` with an inline `node:fs.rmSync` script.
- Replaced `simple-git-hooks` with native `core.hooksPath` (`.githooks/` + `pnpm prepare-hooks`).
- Added pnpm 11 supply-chain controls: `packageManager` field with sha512, `.npmrc` (`minimumReleaseAge`, `package-manager-strict`, `verify-deps-before-run=error`, `verify-store-integrity`), `pnpm-workspace.yaml` `allowBuilds` whitelist.
- All GitHub Actions pinned to commit SHAs (Dependabot-compatible) and bumped to current latest. Release workflow now runs on Node 24.x for npm OIDC trusted publishing.
