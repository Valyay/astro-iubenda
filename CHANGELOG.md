# astro-iubenda

## 0.5.1

### Patch Changes

- b0f4d3e: Close inline-script injection vectors in cookie-footer generation.

  Three values used to be interpolated raw into an inline `<script>` tag:

  - `iubendaOptions` (JSON-stringified): now passed through `escapeForInlineScript`
    which rewrites `<` → `<`, U+2028 → ` `, U+2029 → ` `. Prevents
    values containing `</script>` or JS-illegal line separators from breaking out
    of the inline tag. The escape is applied to the whole emitted snippet for
    defense in depth, not just the JSON segment.
  - `googleTagManagerOptions.dataLayerName`: validated as a JS identifier
    (`/^[A-Za-z_$][\w$]*$/`) at config load. Throws at build time otherwise.
    Matches GTM's own convention (the value is used as `window[name]`).
  - `googleTagManagerOptions.eventName`: validated against an allowlist
    (`/^[A-Za-z0-9_.-]+$/`) at config load. Throws at build time otherwise.
    Covers every real-world GTM event-naming convention while rejecting any
    character that could break out of a single-quoted JS literal.

  Also drops the package-level `preinstall: "npx only-allow pnpm"` script so it no
  longer runs on consumers installing via npm/yarn. The pnpm-only dev policy is
  still enforced by `engines` and the SHA-pinned `packageManager` field.

## 0.5.0

### Minor Changes

- 2397cce: Upgrade tooling, runtime, and supply-chain hardening.

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

## 0.4.2

### Patch Changes

- e3948f0: Update deps

## 0.4.1

### Patch Changes

- 206eced: Updated keywords

## 0.4.0

### Minor Changes

- 3bac3ac: Update size limit
- 6930242: Update dependencies
- a089f2a: Update size limit
- d1e53d0: Improved IubendaOptions, added new examples in README, updated tests

## 0.3.1

### Patch Changes

- 4b03a22: - Add explicit-function-return-type rule
- 9ce5176: Update README to include example image
- e81e78c: Update Node.js version to 20.x

## 0.3.0

### Minor Changes

- b60120b: Cookie Footer

## 0.2.1

### Patch Changes

- c06ac8a: Increased robust of the integration

## 0.2.0

### Minor Changes

- 7d85526: Live hot-reload for policies
  Switched ESLint config to TypeScript rules

## 0.1.1

### Patch Changes

- 0be4723: - Enhanced error handling for Iubenda API responses
  - Improved document fetching with support for JSON and HTML responses
  - Updated Vite plugin to support dynamic code generation and fixed passing function `getDocument` to Astro components
  - Fixed issues with Pro plan detection, empty document handling

## 0.1.0

### Minor Changes

- 80674d9: Add size-limit, move astro to peer deps, update docs and github actions

## 0.0.2

### Patch Changes

- bd9b2b8: Add github actions
- 547fd89: Add tests, ci, structure changes
