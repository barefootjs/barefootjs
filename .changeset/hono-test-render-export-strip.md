---
"@barefootjs/hono": patch
---

Fix child-component inlining in `renderHonoComponent` (`@barefootjs/hono/test-render`) when a sibling component re-exports types or values. The export-stripping pass previously removed only the `export ` keyword, turning a child's `export type { SlotProps }` into a bare `type { SlotProps }` (a syntax error) and breaking the SSR render of any parent whose inlined child carried such a re-export (e.g. `site/ui` Button → Slot). Whole `export type { … }` / `export { … }` re-export statements are now dropped — their bindings are already declared in the inlined body, so SSR loses nothing.
