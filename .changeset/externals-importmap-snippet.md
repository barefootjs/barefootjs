---
"@barefootjs/cli": patch
"@barefootjs/jsx": patch
"@barefootjs/go-template": patch
"@barefootjs/mojolicious": patch
"@barefootjs/hono": patch
---

Emit `barefoot-importmap.html` for template-string adapters (#1644).

Follow-up to #1639/#1641. The externals system writes `barefoot-externals.json`
for every adapter, but the Go html/template and Mojolicious adapters had no
equivalent of Hono's `BfImportMap` component, so a project configuring
`externals` there had nowhere to inject the importmap + preloads.

- `bf build` now emits a ready-to-include `barefoot-importmap.html` snippet
  (generated from the same manifest) alongside `barefoot-externals.json` for
  template-string adapters. Include it via `{{ template "barefoot-importmap.html" . }}`
  (Go) or `%= include 'barefoot-importmap'` (Mojolicious).
- Add `TemplateAdapter.importMapInjection` (`'component' | 'html-snippet'`) so an
  adapter declares how it exposes the importmap. Hono is `'component'` (no
  snippet emitted); Go/Mojo are `'html-snippet'`.
- New `renderImportMapHtml` + `ExternalsManifest` exports from `@barefootjs/jsx`
  are the single source of truth for the snippet HTML.
- New cross-adapter `assertImportMapInjectionContract` in `@barefootjs/adapter-tests`
  fails if a new adapter ships without an importmap injection point.
