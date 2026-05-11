/**
 * BarefootJS Compiler — Reactive attributes on a NESTED `.map()` body (#135).
 *
 * Background: top-level `.map()` already wires `createEffect` for
 * signal-driven attributes on the loop body's root element (covered by
 * `reactive-attrs-in-map.test.ts`). Until #135 the same plumbing was
 * missing for INNER loops — `collectInnerLoops` collected reactive
 * texts but no reactive attrs, the per-item renderItem only emitted
 * `__rt.textContent = …` effects, and `style` / `data-*` / `className`
 * bindings stayed frozen at the SSR value.
 *
 * Surfaced by the board demo's drag preview (#135 Concrete Additions)
 * where `style={{'--drag-opacity': draggingTaskId() === task.id ? '0.4'
 * : '1'}}` on a nested `tasks.map()` root never updated.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('reactive attributes inside a nested .map() body (#135)', () => {
  test('object-style binding on a nested .map() root emits per-item createEffect', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Col { id: string; tasks: { id: number; title: string }[] }

      export function Board() {
        const [draggingId, setDraggingId] = createSignal<number | null>(null)
        const [cols, setCols] = createSignal<Col[]>([])
        return (
          <div>
            {cols().map(col => (
              <div key={col.id}>
                {col.tasks.map(task => (
                  <div
                    key={task.id}
                    style={{ '--drag-opacity': draggingId() === task.id ? '0.4' : '1' }}
                    data-dragging={draggingId() === task.id ? 'true' : 'false'}
                    onPointerDown={() => setDraggingId(task.id)}
                  >{task.title}</div>
                ))}
              </div>
            ))}
          </div>
        )
      }
    `
    const result = compileJSX(source, 'Board.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
    const clientJs = result.files.find((f) => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    const content = clientJs!.content

    // The per-item renderItem callback for the inner `tasks.map(...)`
    // must emit `createEffect` blocks that re-evaluate the reactive
    // `style` and `data-dragging` bindings on the inner-loop root.
    expect(content).toContain("setAttribute('style'")
    expect(content).toContain("setAttribute('data-dragging'")
    expect(content).toContain('styleToCss')
    // Both effects must run inside the inner mapArray's renderItem (so
    // they capture `task` as the inner-loop accessor — `task()` rather
    // than the module-level closure).
    expect(content).toMatch(/createEffect\(\(\) => \{\s*const __v = styleToCss\([\s\S]*?task\(\)\.id/)
  })

  test('non-style reactive attribute (className) wires up too', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Row = { id: number; label: string }
      type Group = { id: string; rows: Row[] }

      export function Tbl() {
        const [active, setActive] = createSignal<number | null>(null)
        const [groups] = createSignal<Group[]>([])
        return (
          <div>
            {groups().map(g => (
              <div key={g.id}>
                {g.rows.map(r => (
                  <span key={r.id} className={active() === r.id ? 'on' : 'off'}>{r.label}</span>
                ))}
              </div>
            ))}
          </div>
        )
      }
    `
    const result = compileJSX(source, 'Tbl.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
    const content = result.files.find((f) => f.type === 'clientJs')!.content

    // className uses the kebab `class` attribute name once routed
    // through `toHtmlAttrName`.
    expect(content).toContain("setAttribute('class'")
    expect(content).toContain('active()')
  })

  test('inner-loop event handler keeps working alongside reactive attrs', () => {
    // Regression guard — make sure adding the reactive-attr emission
    // didn't break the existing inner-loop event-handler emission path.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Item = { id: number; label: string }

      export function L() {
        const [sel, setSel] = createSignal<number | null>(null)
        const [groups] = createSignal<{ id: string; items: Item[] }[]>([])
        return (
          <div>
            {groups().map(g => (
              <div key={g.id}>
                {g.items.map(it => (
                  <button
                    key={it.id}
                    className={sel() === it.id ? 'sel' : ''}
                    onClick={() => setSel(it.id)}
                  >{it.label}</button>
                ))}
              </div>
            ))}
          </div>
        )
      }
    `
    const result = compileJSX(source, 'L.tsx', { adapter })
    expect(result.errors).toHaveLength(0)
    const content = result.files.find((f) => f.type === 'clientJs')!.content
    expect(content).toContain("addEventListener('click'")
    expect(content).toContain("setAttribute('class'")
  })
})
