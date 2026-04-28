/**
 * BarefootJS Compiler - SSR loop markers for @client loops (#872)
 *
 * When a `@client` loop and a conditional sibling live in the same container,
 * the SSR output must include <!--bf-loop--><!--bf-/loop--> boundary markers
 * even when the initial array is empty.
 *
 * Without the markers, mapArray() on the client resolves anchor = null and
 * appends new elements after the conditional marker instead of before it.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { HonoAdapter } from '../../../../packages/adapter-hono/src/adapter/hono-adapter'

const adapter = new HonoAdapter()

describe('@client loop SSR markers (#872)', () => {
  test('emits bf-loop/bf-/loop markers in SSR output when @client loop has a conditional sibling', () => {
    const source = `
'use client'
import { createSignal } from '@barefootjs/client'
export function ChatList() {
  const [items, setItems] = createSignal<string[]>([])
  const [streaming, setStreaming] = createSignal(false)
  return (
    <div id="container">
      {/* @client */ items().map(item => (
        <div key={item} className="item">{item}</div>
      ))}
      {/* @client */ streaming() && (
        <div className="streaming">streaming...</div>
      )}
      <button onClick={() => setItems(prev => [...prev, 'new item'])}>Add</button>
    </div>
  )
}
`
    const result = compileJSXSync(source, 'ChatList.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
    expect(markedTemplate).toBeDefined()

    const content = markedTemplate!.content

    // The @client loop must emit both boundary markers so mapArray()
    // can locate the correct anchor node (endMarker) for insertions.
    // Markers are scoped per-call-site (#1087): `bfComment('loop:<id>')`.
    expect(content).toMatch(/bfComment\('loop:[^']+'\)/)
    expect(content).toMatch(/bfComment\('\/loop:[^']+'\)/)

    // Conditional markers must also be present (unrelated signal)
    expect(content).toContain('bfComment("cond-start:')
    expect(content).toContain('bfComment("cond-end:')

    // The loop markers must appear BEFORE the conditional markers in the output
    const loopMarkerPos = content.search(/bfComment\('loop:/)
    const condMarkerPos = content.indexOf('bfComment("cond-start:')
    expect(loopMarkerPos).toBeLessThan(condMarkerPos)
  })

  test('emits loop markers for @client loop with no conditional siblings', () => {
    const source = `
'use client'
import { createSignal } from '@barefootjs/client'
export function ItemList() {
  const [items, setItems] = createSignal<string[]>([])
  return (
    <ul>
      {/* @client */ items().map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}
`
    const result = compileJSXSync(source, 'ItemList.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
    expect(markedTemplate).toBeDefined()

    const content = markedTemplate!.content

    // Even with no siblings, loop markers must be emitted for consistent behavior.
    // Markers are scoped per-call-site (#1087): `bfComment('loop:<id>')`.
    expect(content).toMatch(/bfComment\('loop:[^']+'\)/)
    expect(content).toMatch(/bfComment\('\/loop:[^']+'\)/)
  })

  test('does not render items in SSR output for @client loop (items are rendered client-side only)', () => {
    const source = `
'use client'
import { createSignal } from '@barefootjs/client'
export function ItemList() {
  const [items, setItems] = createSignal<string[]>([])
  return (
    <ul>
      {/* @client */ items().map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}
`
    const result = compileJSXSync(source, 'ItemList.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
    const content = markedTemplate!.content

    // SSR must not render actual list items (client-only means no server rendering of items)
    expect(content).not.toContain('<li')
    // But loop boundary markers must be present (scoped per-call-site, #1087)
    expect(content).toMatch(/bfComment\('loop:[^']+'\)/)
    expect(content).toMatch(/bfComment\('\/loop:[^']+'\)/)
  })

  test('@client filter+map loop emits loop markers in SSR output', () => {
    const source = `
'use client'
import { createSignal } from '@barefootjs/client'
type Item = { name: string; tags: string[] }
export function ClientOnly() {
  const [items, setItems] = createSignal<Item[]>([])
  return (
    <ul>
      {/* @client */ items().filter(item => item.tags.includes('featured')).map((item, i) => (
        <li key={i}>{item.name}</li>
      ))}
    </ul>
  )
}
`
    const result = compileJSXSync(source, 'Test.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
    const content = markedTemplate!.content

    expect(content).toMatch(/bfComment\('loop:[^']+'\)/)
    expect(content).toMatch(/bfComment\('\/loop:[^']+'\)/)
  })

  // Regression: #1087. Two `.map()` calls under the same parent must get
  // distinct marker ids in both SSR and client output so each `mapArray`
  // call reconciles its own range. Before the fix, both loops shared the
  // parent slot and `findLoopMarkers()` returned the LAST pair to every
  // consumer — the second loop overwrote the first.
  test('sibling .map() calls under the same parent get distinct marker ids', () => {
    const source = `
'use client'
import { createSignal } from '@barefootjs/client'
export function SiblingMaps() {
  const [a] = createSignal([1, 2, 3])
  const [b] = createSignal([4, 5, 6])
  return (
    <div>
      {a().map((n) => <span key={\`a-\${n}\`} data-set="a">{String(n)}</span>)}
      {b().map((n) => <span key={\`b-\${n}\`} data-set="b">{String(n)}</span>)}
    </div>
  )
}
`
    const result = compileJSXSync(source, 'SiblingMaps.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const markedTemplate = result.files.find(f => f.type === 'markedTemplate')
    const ssrContent = markedTemplate!.content

    const ssrIds = [...ssrContent.matchAll(/bfComment\('loop:([^']+)'\)/g)].map(m => m[1])
    expect(ssrIds.length).toBe(2)
    expect(ssrIds[0]).not.toBe(ssrIds[1])

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    const jsContent = clientJs!.content

    // Each mapArray call must carry the matching marker id as its 5th arg
    // — that's how the runtime disambiguates sibling loops at the same parent.
    // The marker id appears on the closing line as `}, '<id>')` (multi-line
    // renderItem) or `},  '<id>')` (single-line — same shape after the body).
    const mapArrayMarkerIds = [...jsContent.matchAll(/^\s*}\s*,\s*'([^']+)'\)\s*$/gm)].map(m => m[1])
    expect(mapArrayMarkerIds.length).toBeGreaterThanOrEqual(2)
    for (const id of ssrIds) {
      expect(mapArrayMarkerIds).toContain(id)
    }
  })
})
