/**
 * BarefootJS Compiler - Named-export block must survive into the marked template.
 *
 * `export { A, B }` and `export { A } from './path'` declarations at module
 * level were being dropped by the IR-to-template emitter, while inline
 * `export function/const` and `import` statements survived. Re-exporting an
 * imported symbol from a `"use client"` file (a common pattern when grouping
 * a chart's `Bar`, `Line`, `Area` siblings under a single `chart/index.tsx`
 * barrel) was therefore impossible — the dist file would `import { Bar }
 * from './bar'` but never re-export it, breaking SSR consumers.
 *
 * Invariant: the marked-template output must preserve every named-export
 * specifier that was present in the source, regardless of whether the
 * referent is a local declaration, an imported symbol, or a re-export from
 * another module. Inline `export function Foo` declarations must NOT be
 * double-emitted in a trailing `export { Foo }` block.
 *
 * Confirmed via real-world breakage in the chart Bar JSX-native PoC
 * (PR #1077, ui/components/ui/chart/index.tsx).
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

function getMarkedTemplate(source: string): string {
  const result = compileJSXSync(source, 'index.tsx', { adapter })
  expect(result.errors).toHaveLength(0)
  const out = result.files.find(f => f.type === 'markedTemplate')
  expect(out).toBeDefined()
  return out!.content
}

describe('named-export block preservation', () => {
  test('export { Local, Imported } block re-exports an imported symbol', () => {
    const source = `'use client'
import { createSignal } from '@barefootjs/client'
import { Bar } from './bar'

function ChartContainer(props: { children: unknown }) {
  return <div>{props.children}</div>
}

export {
  ChartContainer,
  Bar,
}
`
    const template = getMarkedTemplate(source)

    // The import the re-export depends on must still survive (regression guard).
    expect(template).toContain(`import { Bar } from './bar'`)

    // The re-export must appear so downstream consumers can `import { Bar }`
    // from the compiled barrel. Either form (single block listing both, or
    // separate specifier-list line for Bar) is acceptable — what matters is
    // that `Bar` is module-exported.
    expect(template).toMatch(/export\s*\{[^}]*\bBar\b[^}]*\}/)

    // ChartContainer is inline-exported via the function declaration; ensure
    // we don't lose it either.
    expect(template).toContain('export function ChartContainer')
  })

  test(`export { X } from './y' re-export is preserved verbatim`, () => {
    const source = `'use client'
import { createSignal } from '@barefootjs/client'

function ChartContainer(props: { children: unknown }) {
  return <div>{props.children}</div>
}

export { Bar } from './bar'
export { ChartContainer }
`
    const template = getMarkedTemplate(source)

    // The re-export-from must survive so consumers receive Bar without the
    // barrel having to import-then-export.
    expect(template).toMatch(/export\s*\{\s*Bar\s*\}\s*from\s*['"]\.\/bar['"]/)

    // ChartContainer must still be exported (either inline or via the
    // trailing export block).
    expect(
      /export function ChartContainer/.test(template) ||
        /export\s*\{[^}]*\bChartContainer\b[^}]*\}/.test(template)
    ).toBe(true)
  })

  test('aliased re-export is preserved even when local has inline export', () => {
    const source = `'use client'
import { createSignal } from '@barefootjs/client'

export function ChartContainer(props: { children: unknown }) {
  return <div>{props.children}</div>
}

export { ChartContainer as DefaultChartContainer }
`
    const template = getMarkedTemplate(source)

    // The local already ships as `export function ChartContainer` so it
    // should appear once. The aliased re-export adds an additional
    // external name (`DefaultChartContainer`) that does NOT collide with
    // the inline export and must be preserved.
    expect(template.match(/export function ChartContainer\b/g)?.length).toBe(1)
    expect(template).toMatch(/export\s*\{\s*ChartContainer\s+as\s+DefaultChartContainer\s*\}/)
  })

  test('inline-exported function is not double-emitted by trailing export block', () => {
    const source = `'use client'
import { createSignal } from '@barefootjs/client'
import { Bar } from './bar'

export function ChartContainer(props: { children: unknown }) {
  return <div>{props.children}</div>
}

export { ChartContainer, Bar }
`
    const template = getMarkedTemplate(source)

    // ChartContainer is declared inline-exported AND listed in the trailing
    // export block. The inline form must survive (it carries the body), and
    // the trailing block's ChartContainer specifier must NOT cause a
    // duplicate `export { ChartContainer }` line — that would be a redeclare
    // error in the compiled output. Bar (which has no inline export) must
    // be re-exported.
    const inlineMatches = template.match(/export function ChartContainer\b/g) ?? []
    expect(inlineMatches.length).toBe(1)

    // Bar must appear in some `export { ... }` form so it reaches consumers.
    expect(template).toMatch(/export\s*\{[^}]*\bBar\b[^}]*\}/)

    // No duplicate ChartContainer export specifier — i.e. there must not be
    // both `export function ChartContainer` and a separate
    // `export { ChartContainer }` (without a `from` clause) listing it
    // again as a local re-export. A combined `export { ChartContainer, Bar }`
    // would also be a redeclare; the trailing block must filter
    // ChartContainer out and emit only `export { Bar }`.
    const localBlockReexports =
      template.match(/export\s*\{([^}]*)\}\s*(?!from)/g) ?? []
    for (const block of localBlockReexports) {
      expect(block).not.toMatch(/\bChartContainer\b/)
    }
  })
})
