---
"@barefootjs/cli": minor
---

Move the preview tool into `@barefootjs/cli` and rewrite it as a compiler-based CSR build. `bf preview <component>` compiles the component (and its deps) to client JS and bundles a browser preview that renders via `@barefootjs/client`'s `render()` — full reactivity for stateful components, no SSR server. Output is static files served with `npx serve`. The standalone `@barefootjs/preview` package is removed; preview now ships with the CLI (no Hono, no separate install).
