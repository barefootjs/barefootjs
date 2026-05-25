---
"@barefootjs/cli": patch
---

Fix scaffold tsconfig paths order so wrangler resolves compiled SSR templates (with hydration markers and script collection) instead of raw `'use client'` source files. Also bump vitest from `^2.0.0` to `^4.0.0` to resolve esbuild vulnerability (GHSA-67mh-4wv8-2f99).
