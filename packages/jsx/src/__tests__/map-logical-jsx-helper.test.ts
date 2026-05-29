/**
 * BarefootJS Compiler — `.map()` callback whose body is a logical
 * expression (`&&` / `||` / `??`) that renders JSX.
 *
 * Regression for #1665: calling a module-level JSX helper from inside a
 * reactive `.map()` child (`THEMES.map(t => sel === t.id && themeLogo(t.id))`)
 * threw `ReferenceError: themeLogo is not defined` at hydration.
 *
 * Root cause: `transformMapCall` only recognised JSX-element, ternary,
 * parenthesized, flatMap-array, and block callback bodies. A logical-`&&`
 * body fell through, leaving `children` empty, so the whole `.map(...)`
 * was emitted verbatim as a reactive-text expression — the inline JSX was
 * never compiled and the JSX helper was never inlined nor declared,
 * producing a ReferenceError.
 *
 * The fix routes a JSX-rendering logical callback body through the shared
 * JSX expression transformer, which lowers it into an IRConditional and
 * inlines any JSX helper (the same path the ternary form already used).
 * The routing is scoped to logical operators so the bare-call body
 * (`map(t => renderItem(t))`, owned by #546) and scalar logical bodies
 * (`t.active && t.label`) keep their existing reactive-text behaviour.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('.map() with logical / JSX-helper-call body (#1665)', () => {
  test('module-level JSX helper in a `&&` map body is inlined, not left as a bare call', () => {
    const source = `
      'use client'
      const THEMES = [{ id: 'piconic' }, { id: 'hono' }]
      function themeLogo(id: string) {
        if (id === 'hono') return <span>hono</span>
        return <span>piconic</span>
      }
      export function Header(props: { sel: string }) {
        return <div>{THEMES.map(t => props.sel === t.id && themeLogo(t.id))}</div>
      }
    `
    const result = compileJSX(source, 'Header.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')!.content

    // The helper must NOT survive as a runtime call in the client bundle —
    // it is inlined. A surviving `themeLogo(` call with no declaration is
    // the exact ReferenceError the issue reported.
    expect(clientJs).not.toMatch(/themeLogo\s*\(/)

    // The map is compiled into a loop, and the helper's JSX is inlined.
    expect(clientJs).toContain('<!--bf-loop')
    expect(clientJs).toContain('hono')
    expect(clientJs).toContain('piconic')
  })

  test('parenthesized `&&` with a single-return JSX helper is inlined', () => {
    const source = `
      'use client'
      const THEMES = [{ id: 'piconic' }, { id: 'hono' }]
      function themeLogo(id: string) { return <span>{id}</span> }
      export function Header(props: { sel: string }) {
        return <div>{THEMES.map(t => (props.sel === t.id && themeLogo(t.id)))}</div>
      }
    `
    const result = compileJSX(source, 'Header.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')!.content

    expect(clientJs).not.toMatch(/themeLogo\s*\(/)
    expect(clientJs).toContain('<!--bf-loop')
    expect(clientJs).toContain('<span')
  })

  test('bare JSX-helper call body keeps its #546 reactive-text behaviour', () => {
    // Boundary guard: the narrowed fix must NOT re-route a bare call body
    // into the conditional path — that remains #546 territory. A local
    // arrow helper is declared in init scope, so the call survives.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function List() {
        const [items, _set] = createSignal([{ id: '1' }])
        const renderItem = (item: any) => <li>{item.id}</li>
        return <ul>{items().map(item => renderItem(item))}</ul>
      }
    `
    const result = compileJSX(source, 'List.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
    const clientJs = result.files.find((f) => f.type === 'clientJs')!.content
    // The bare call is preserved (not inlined into a conditional loop).
    expect(clientJs).toMatch(/renderItem\s*\(/)
  })

  test('inline JSX in a `&&` map body compiles instead of emitting raw JSX verbatim', () => {
    const source = `
      'use client'
      const THEMES = [{ id: 'piconic' }, { id: 'hono' }]
      export function Header(props: { sel: string }) {
        return <div>{THEMES.map(t => props.sel === t.id && <span>{t.id}</span>)}</div>
      }
    `
    const result = compileJSX(source, 'Header.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find((f) => f.type === 'clientJs')!.content
    // Compiled into a loop with a conditional branch — not the raw,
    // un-compiled `<span>{t.id}</span>` JSX literal the buggy path left
    // inside the client-bundle template string.
    expect(clientJs).toContain('<!--bf-loop')
    expect(clientJs).not.toContain('<span>{t.id}</span>')
  })

  test('scalar `&&` map body keeps its plain reactive-text behaviour', () => {
    // Guard: a non-JSX logical body must NOT be re-routed into the
    // conditional-control-flow path. It stays a verbatim map expression.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Labels() {
        const [items, _set] = createSignal([{ active: true, name: 'A' }])
        return <div>{items().map(t => t.active && t.name)}</div>
      }
    `
    const result = compileJSX(source, 'Labels.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
    const clientJs = result.files.find((f) => f.type === 'clientJs')!.content
    // Still rendered as the raw map expression (no loop control flow).
    expect(clientJs).not.toContain('<!--bf-loop')
    expect(clientJs).toContain('.map(')
  })
})
