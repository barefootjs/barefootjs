/**
 * BarefootJS Compiler - SVG mapArray namespace preservation (#135).
 *
 * When a `.map()` inside an `<svg>` produces SVG elements (e.g.
 * `<path>`), the compiler-generated `renderItem` must parse its
 * template under SVG context. The default `template.innerHTML = '<path/>'`
 * produces an `HTMLUnknownElement` in xhtml namespace, so the SVG
 * renderer ignores it (`getBoundingClientRect()` returns 0×0). Surfaced
 * by the Graph/DAG Editor block — newly created edges were "missing"
 * from the canvas because their `<path>` was in the wrong namespace.
 *
 * Fix: wrap the `innerHTML` in `<svg>...</svg>` and descend one extra
 * level when the loop body's root tag is an SVG element.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('SVG mapArray namespace preservation (#135)', () => {
  test('SVG path mapArray wraps innerHTML with <svg> for correct namespace', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Edge { id: string; d: string }

      export function Graph() {
        const [edges, setEdges] = createSignal<Edge[]>([])
        return (
          <svg>
            {edges().map((e) => (
              <path key={e.id} d={e.d} />
            ))}
          </svg>
        )
      }
    `
    const result = compileJSXSync(source, 'Graph.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    const content = clientJs!.content

    // Must wrap with <svg>...</svg> for foreign-content parsing
    expect(content).toContain('<svg>')
    expect(content).toContain('</svg>')
    // Descend one extra level
    expect(content).toContain('.firstElementChild.firstElementChild.cloneNode(true)')
    // The plain HTML clone path must NOT be used for SVG roots
    expect(content).not.toMatch(/__tpl\.innerHTML = `<path[^`]*`/)
  })

  test('SVG circle mapArray uses SVG context too', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Node { id: string; x: number; y: number }

      export function Pts() {
        const [nodes, setNodes] = createSignal<Node[]>([])
        return (
          <svg>
            <g>
              {nodes().map((n) => (
                <circle key={n.id} cx={n.x} cy={n.y} r={5} />
              ))}
            </g>
          </svg>
        )
      }
    `
    const result = compileJSXSync(source, 'Pts.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    const content = clientJs!.content

    expect(content).toContain('<svg>')
    expect(content).toContain('.firstElementChild.firstElementChild.cloneNode(true)')
  })

  test('HTML li mapArray is unchanged (no SVG wrapping)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Item { id: string; label: string }

      export function L() {
        const [items, setItems] = createSignal<Item[]>([])
        return (
          <ul>
            {items().map((it) => (
              <li key={it.id}>{it.label}</li>
            ))}
          </ul>
        )
      }
    `
    const result = compileJSXSync(source, 'L.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    const content = clientJs!.content

    // HTML loops must NOT be wrapped — keep the plain single-descent path
    expect(content).toContain('.firstElementChild.cloneNode(true)')
    expect(content).not.toContain('.firstElementChild.firstElementChild.cloneNode(true)')
    expect(content).not.toContain('<svg>')
  })

  /**
   * #1088: when a `.map()` body is a ternary whose branches are all SVG
   * tags, the wrap heuristic must still apply. Without the fix, the
   * `__tpl.innerHTML = `${cond ? `<circle/>` : `<rect/>`}`` clone path
   * produced HTMLUnknownElements in xhtml namespace and the elements were
   * invisible. Surfaced by `PolarGrid` (#1086 step 2) where polygon /
   * circle / line shapes are flattened into one keyed list.
   */
  test('SVG ternary body wraps when both branches are SVG-rooted', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Shape = { key: string; kind: 'circle' | 'rect'; size: number }

      export function CondMap() {
        const [shapes] = createSignal<Shape[]>([])
        return (
          <svg viewBox="0 0 100 100">
            {shapes().map((s) =>
              s.kind === 'circle'
                ? <circle key={s.key} cx="50" cy="50" r={String(s.size)} fill="red" />
                : <rect key={s.key} x="10" y="10" width={String(s.size)} height={String(s.size)} fill="blue" />
            )}
          </svg>
        )
      }
    `
    const result = compileJSXSync(source, 'CondMap.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    const content = clientJs!.content

    // Wrap with <svg>...</svg> for foreign-content parsing
    expect(content).toMatch(/__tpl\.innerHTML = `<svg>\$\{/)
    expect(content).toMatch(/\}<\/svg>`/)
    // Descend one extra level
    expect(content).toContain('.firstElementChild.firstElementChild.cloneNode(true)')
  })

  test('SVG 3-way ternary wraps recursively (PolarGrid pattern)', () => {
    // PolarGrid flattens concentric grid shapes (polygon / circle) and
    // radial spokes (line) into one list and renders them with a 3-way
    // ternary. The compiler nests the inner conditional inside
    // `<!--bf-cond-start:sX-->` markers, so the wrap heuristic must skip
    // those and recurse into the inner `${...}`.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Shape = { key: string; kind: 'polygon' | 'circle' | 'line' }

      export function PolarGridLike() {
        const [shapes] = createSignal<Shape[]>([])
        return (
          <svg>
            {shapes().map((s) =>
              s.kind === 'polygon'
                ? <polygon key={s.key} points="0,0 1,1 2,0" fill="none" />
                : s.kind === 'circle'
                  ? <circle key={s.key} cx="0" cy="0" r="5" fill="none" />
                  : <line key={s.key} x1="0" y1="0" x2="1" y2="1" />
            )}
          </svg>
        )
      }
    `
    const result = compileJSXSync(source, 'PolarGridLike.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    const content = clientJs!.content

    expect(content).toMatch(/__tpl\.innerHTML = `<svg>\$\{/)
    expect(content).toContain('.firstElementChild.firstElementChild.cloneNode(true)')
  })

  test('mixed-namespace ternary body falls through to no-wrap', () => {
    // Conservative: if either branch is HTML, do not wrap. Wrapping in
    // <svg> would force the HTML branch into foreign-content parsing,
    // which is its own kind of namespace bug.
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Item = { key: string; useSvg: boolean }

      export function Mixed() {
        const [items] = createSignal<Item[]>([])
        return (
          <div>
            {items().map((i) =>
              i.useSvg
                ? <circle key={i.key} cx="0" cy="0" r="5" />
                : <span key={i.key}>x</span>
            )}
          </div>
        )
      }
    `
    const result = compileJSXSync(source, 'Mixed.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    const content = clientJs!.content

    // Plain (non-SVG-wrapped) clone path must be used
    expect(content).toContain('.firstElementChild.cloneNode(true)')
    expect(content).not.toContain('.firstElementChild.firstElementChild.cloneNode(true)')
  })

  test('HTML ternary body is unchanged (no wrap)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      type Item = { key: string; isPrimary: boolean }

      export function Toggle() {
        const [items] = createSignal<Item[]>([])
        return (
          <ul>
            {items().map((i) =>
              i.isPrimary
                ? <li key={i.key}>primary</li>
                : <li key={i.key}>secondary</li>
            )}
          </ul>
        )
      }
    `
    const result = compileJSXSync(source, 'Toggle.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    const content = clientJs!.content

    expect(content).toContain('.firstElementChild.cloneNode(true)')
    expect(content).not.toContain('.firstElementChild.firstElementChild.cloneNode(true)')
    expect(content).not.toContain('<svg>')
  })
})
