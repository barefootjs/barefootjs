---
"@barefootjs/preview": minor
---

Rewrite preview to compiler-based CSR. Components are compiled to client JS and rendered in the browser via `@barefootjs/client`'s `render()`, giving full reactivity for stateful components. Removes the Hono runtime server; output is static files served with `npx serve`. Uses CSRAdapter (no Hono dependency).
