// Cross-adapter importmap-injection contract.
//
// When `externals` / `bundleEntries` are configured, `bf build` emits
// `barefoot-externals.json` for EVERY adapter (the importmap + modulepreload
// manifest). Each adapter must give the application author a way to inject that
// manifest into the page <head> — otherwise configured externals 404 on their
// bare specifiers (issues #1639 / #1644). Adapters satisfy this two ways:
//
//   - 'component'    — a render-time component (Hono's `BfImportMap`) reads the
//                      manifest; `bf build` emits no static snippet.
//   - 'html-snippet' — a template-string target (Go html/template, Mojolicious
//                      EP) has no component layer, so `bf build` emits a static
//                      `barefoot-importmap.html` (via `renderImportMapHtml`).
//
// The contract is adapter-agnostic: a new adapter satisfies it by computing the
// facts below from its own machinery and passing them to
// `assertImportMapInjectionContract`. The facts type avoids adapter-specific
// terminology so adding an adapter does not change the contract surface — and a
// new adapter that ships without an injection point fails the contract instead
// of silently leaving externals unresolvable.

import { expect } from 'bun:test'

export interface ImportMapInjectionFacts {
  /** Adapter name, surfaced in failure messages. */
  adapterName: string
  /**
   * The adapter's declared injection strategy (`TemplateAdapter.importMapInjection`).
   * Must be set — a missing strategy means a configured `externals` has nowhere
   * to inject.
   */
  strategy: 'component' | 'html-snippet' | undefined
  /**
   * The actual importmap markup this adapter injects for a sample manifest:
   *   - 'component' adapters: the rendered output of the adapter's component
   *     (e.g. `String(BfImportMap({ base, externals: manifest }))`).
   *   - 'html-snippet' adapters: the static snippet `bf build` would emit
   *     (i.e. `renderImportMapHtml(manifest)`).
   * The contract checks it carries a usable importmap.
   */
  renderedImportMap: string
  /**
   * A bare specifier from the sample manifest's externals (e.g. `zod`) that the
   * rendered importmap MUST resolve. Proves the adapter actually consumes the
   * manifest rather than hardcoding only the `@barefootjs/client*` defaults —
   * the exact regression behind #1639.
   */
  externalSpecifier: string
}

/**
 * Assert that an adapter satisfies the importmap-injection contract. Call from
 * a per-adapter (or the shared) test after extracting the facts from that
 * adapter's machinery.
 */
export function assertImportMapInjectionContract(facts: ImportMapInjectionFacts): void {
  expect(
    facts.strategy === 'component' || facts.strategy === 'html-snippet',
    `${facts.adapterName}: importMapInjection must be 'component' or 'html-snippet', got ${String(facts.strategy)}`,
  ).toBe(true)

  expect(
    facts.renderedImportMap.includes('<script type="importmap">'),
    `${facts.adapterName}: injected markup is missing <script type="importmap">`,
  ).toBe(true)

  expect(
    facts.renderedImportMap.includes(facts.externalSpecifier),
    `${facts.adapterName}: injected importmap does not resolve external "${facts.externalSpecifier}" — the manifest is being ignored (#1639)`,
  ).toBe(true)
}
