---
"@barefootjs/jsx": patch
"@barefootjs/hono": patch
---

Unify the importmap manifest type across the component and snippet paths.

Both importmap injection paths now describe `barefoot-externals.json` with one
type. `@barefootjs/jsx` exports a shared `ImportMapManifest` (the optional-field
subset the renderer needs); `renderImportMapHtml` takes it, and the strict build
output `ExternalsManifest` remains its all-required superset. Hono's
`BarefootExternalsManifest` is now a back-compat alias of `ImportMapManifest`
rather than a separate interface, so the Hono `BfImportMap` prop and the
`bf build` snippet share the same manifest shape.
