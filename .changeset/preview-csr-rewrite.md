---
"@barefootjs/cli": minor
---

Move the preview tool into `@barefootjs/cli` and rewrite it as a compiler-based CSR build. `bf preview <component>` compiles the component (and its deps) to client JS and bundles a browser preview that renders via `@barefootjs/client`'s `render()` — full reactivity for stateful components, no SSR server. The standalone `@barefootjs/preview` package is removed; preview now ships with the CLI (no Hono, no separate install).

Preview only compiles the previewed component's transitive dependency closure instead of the whole component registry, cutting a single-component build from ~26s to ~7s. New flags: `--serve` starts a built-in static server (no more separate `npx serve` step), and `--watch` rebuilds on source changes with live reload (`--port` to choose the port).
