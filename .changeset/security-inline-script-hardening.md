---
"astro-iubenda": patch
---

Close inline-script injection vectors in cookie-footer generation.

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
