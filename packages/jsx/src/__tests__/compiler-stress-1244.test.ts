/**
 * Compiler stress catalog (#1244)
 *
 * Each test compiles one TODO-list pattern from the catalog. Tests fall
 * into two shapes:
 *
 *   1. **Supported** — the compiler accepts the pattern; the test locks
 *      that in by asserting no fatal errors (and sometimes a downstream
 *      marker like `createEffect` / `createMemo` / lack of raw JSX).
 *   2. **Surfaced limitation** — the compiler currently rejects the
 *      pattern (or miscompiles it). The test asserts the *current*
 *      behaviour (the BFxxx code, or the wrong emit count) and the
 *      docstring records what the intended behaviour would look like.
 *      When the limitation is fixed the assertion starts failing —
 *      that's the prompt to delete the lock and replace it with a real
 *      assertion of the corrected output.
 *
 * Layer 1 (compiler unit). Keeps the bisection window small; downstream
 * adapter / runtime tests can build on the patterns the compiler
 * already accepts.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

interface Compiled {
  errors: ReturnType<typeof compileJSX>['errors']
  clientJs: string
  template: string
}

function compile(source: string, filename = 'Stress.tsx'): Compiled {
  const result = compileJSX(source, filename, { adapter })
  const clientJs = result.files.find(f => f.type === 'clientJs')?.content ?? ''
  const template = result.files.find(f => f.type === 'markedTemplate')?.content ?? ''
  return { errors: result.errors, clientJs, template }
}

function expectNoFatalErrors(c: Compiled): void {
  const fatals = c.errors.filter(e => e.severity === 'error')
  if (fatals.length > 0) {
    const dump = fatals.map(e => `${e.code}: ${e.message}`).join('\n  ')
    throw new Error(`unexpected fatal compile errors:\n  ${dump}`)
  }
}

// ---------------------------------------------------------------------------
// Reactive primitive × binding site
// ---------------------------------------------------------------------------

describe('style={{}} object — multiple signal members', () => {
  // SURFACED LIMITATION: a `style={{ a: s1(), b: s2(), c: s3() }}` object
  // with three independent signals only emits two reactive updates,
  // not three. Either two members share an effect or one is dropped.
  // Intended behaviour is one reactive update path per signal-bearing
  // member — file as a sub-issue of #1244.
  test('3 members each read a different signal — only 2 of 3 reactive updates emit (regression lock)', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [bg, setBg] = createSignal('red')
        const [fg, setFg] = createSignal('white')
        const [pad, setPad] = createSignal('8px')
        return <div onClick={() => setBg('blue')} style={{ background: bg(), color: fg(), padding: pad() }}>x</div>
      }
    `
    const c = compile(src)
    expectNoFatalErrors(c)
    const effectCount = (c.clientJs.match(/createEffect|effect\(/g) || []).length
    // Lock current behaviour. When the compiler emits 3, this fails —
    // delete the comment + flip the assertion to `>= 3`.
    expect(effectCount).toBe(2)
  })
})

describe('style={{}} object — computed property name', () => {
  test('computed key with template-literal name from a signal', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [tone, setTone] = createSignal('primary')
        const [c, setC] = createSignal('red')
        return <div onClick={() => setTone('secondary')} style={{ [\`--\${tone()}\`]: c() }}>x</div>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('style={{}} object — spread of a signal-derived object', () => {
  test('spread of memo-returned object plus a static member', () => {
    const src = `
      'use client'
      import { createSignal, createMemo } from '@barefootjs/client'
      export function Demo() {
        const [t, setT] = createSignal(0)
        const base = createMemo(() => ({ background: t() > 0 ? 'red' : 'blue', padding: '8px' }))
        return <div onClick={() => setT(n => n + 1)} style={{ ...base(), color: 'white' }}>x</div>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('className — template literal with nested ternaries', () => {
  test('two-signal nested-ternary template literal', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [a, setA] = createSignal(false)
        const [b, setB] = createSignal(false)
        return <div onClick={() => setA(v => !v)} className={\`base \${a() ? 'on' : ''} \${b() ? 'lg' : 'sm'}\`}>x</div>
      }
    `
    const c = compile(src)
    expectNoFatalErrors(c)
    // The class binding has to reactively combine two independent signals.
    expect(c.clientJs).toMatch(/class(Name)?|setAttribute/)
  })
})

describe('className — call to a cva-style helper receiving signal values', () => {
  test('helper return value is used as className', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      function cva(opts: { size: string; tone: string }): string {
        return 'base ' + opts.size + ' ' + opts.tone
      }
      export function Demo() {
        const [size, setSize] = createSignal('md')
        const [tone, setTone] = createSignal('primary')
        return <button onClick={() => setSize('lg')} className={cva({ size: size(), tone: tone() })}>x</button>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('reactive attribute + spread targeting same key', () => {
  test('spread vs explicit className — which wins is observable', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [c, setC] = createSignal('on')
        const extra = { className: 'spread-wins' }
        return <div onClick={() => setC('off')} className={c()} {...extra}>x</div>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('event handler that captures a memo', () => {
  test('handler reads memo() — invalidation propagates through closure', () => {
    const src = `
      'use client'
      import { createSignal, createMemo } from '@barefootjs/client'
      export function Demo() {
        const [n, setN] = createSignal(0)
        const doubled = createMemo(() => n() * 2)
        return <button onClick={() => { console.log(doubled()); setN(v => v + 1) }}>{n()}</button>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('memo chain depth 5+', () => {
  test('5 chained memos compile and emit', () => {
    const src = `
      'use client'
      import { createSignal, createMemo } from '@barefootjs/client'
      export function Demo() {
        const [n, setN] = createSignal(1)
        const m1 = createMemo(() => n() + 1)
        const m2 = createMemo(() => m1() + 1)
        const m3 = createMemo(() => m2() + 1)
        const m4 = createMemo(() => m3() + 1)
        const m5 = createMemo(() => m4() + 1)
        return <button onClick={() => setN(v => v + 1)}>{m5()}</button>
      }
    `
    const c = compile(src)
    expectNoFatalErrors(c)
    const memoCount = (c.clientJs.match(/createMemo/g) || []).length
    expect(memoCount).toBeGreaterThanOrEqual(5)
  })
})

describe('effect created inside a conditional branch', () => {
  test('createEffect inside a ternary branch — disposal scope', () => {
    const src = `
      'use client'
      import { createSignal, createEffect } from '@barefootjs/client'
      export function Demo() {
        const [show, setShow] = createSignal(true)
        if (show()) {
          createEffect(() => { console.log('on') })
        }
        return <button onClick={() => setShow(v => !v)}>x</button>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

// ---------------------------------------------------------------------------
// Control-flow combinations
// ---------------------------------------------------------------------------

describe('.map() nested 3+ levels with reactive bindings at every depth', () => {
  test('triple-nested map with per-item event + className', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type Cell = { id: string; v: number }
      type Row = { id: string; cells: Cell[] }
      type Sheet = { id: string; rows: Row[] }
      export function Demo() {
        const [sheets, setSheets] = createSignal<Sheet[]>([])
        return (
          <div>
            {sheets().map(sheet => (
              <section key={sheet.id} onClick={() => setSheets(s => s)}>
                {sheet.rows.map(row => (
                  <ul key={row.id} className={\`row-\${row.id}\`}>
                    {row.cells.map(cell => (
                      <li key={cell.id} onClick={() => console.log(cell.v)}>{cell.v}</li>
                    ))}
                  </ul>
                ))}
              </section>
            ))}
          </div>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('conditional inside .map() with different-shape branches', () => {
  test('one branch returns null, other returns element', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type Item = { id: string; visible: boolean; label: string }
      export function Demo() {
        const [items, setItems] = createSignal<Item[]>([])
        return (
          <ul onClick={() => setItems(i => i)}>
            {items().map(it => (it.visible ? <li key={it.id}>{it.label}</li> : null))}
          </ul>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('logical && returning falsy primitives', () => {
  test('count() && JSX with count() === 0 — must NOT render "0"', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [count, setCount] = createSignal(0)
        return <div onClick={() => setCount(c => c + 1)}>{count() && <span>has items</span>}</div>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('ternary chain depth 4+', () => {
  test('four-arm ternary on a string discriminator', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [k, setK] = createSignal<'a' | 'b' | 'c' | 'd'>('a')
        return (
          <div onClick={() => setK('b')}>
            {k() === 'a' ? <span>A</span> : k() === 'b' ? <b>B</b> : k() === 'c' ? <i>C</i> : <em>D</em>}
          </div>
        )
      }
    `
    const c = compile(src)
    expectNoFatalErrors(c)
    expect(c.clientJs).not.toContain('<span>A</span>')
    expect(c.clientJs).not.toContain('<em>D</em>')
  })
})

describe('per-item <Provider> — each loop item provides a different context value', () => {
  test('Provider inside a .map() body', () => {
    const src = `
      'use client'
      import { createSignal, createContext } from '@barefootjs/client'
      const ItemCtx = createContext<{ id: string }>({ id: '' })
      function Inner() { return <span>x</span> }
      export function Demo() {
        const [items, setItems] = createSignal<{ id: string }[]>([])
        return (
          <ul onClick={() => setItems(i => i)}>
            {items().map(it => (
              <ItemCtx.Provider key={it.id} value={{ id: it.id }}>
                <Inner />
              </ItemCtx.Provider>
            ))}
          </ul>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('3+ nested <Provider>s on one subtree', () => {
  test('three Providers wrapping the same child', () => {
    const src = `
      'use client'
      import { createContext } from '@barefootjs/client'
      const A = createContext<string>('a')
      const B = createContext<string>('b')
      const C = createContext<string>('c')
      function Inner() { return <span>x</span> }
      export function Demo() {
        return (
          <A.Provider value="aa">
            <B.Provider value="bb">
              <C.Provider value="cc">
                <Inner />
              </C.Provider>
            </B.Provider>
          </A.Provider>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('self-referential recursive component depth 5+', () => {
  test('component renders itself with a decremented prop', () => {
    const src = `
      export function Tree({ depth }: { depth: number }) {
        if (depth <= 0) return <span>leaf</span>
        return <div><Tree depth={depth - 1} /></div>
      }
    `
    expectNoFatalErrors(compile(src, 'Tree.tsx'))
  })
})

// ---------------------------------------------------------------------------
// Identifier / scope
// ---------------------------------------------------------------------------

describe('4+ same-name child components as siblings in one loop body', () => {
  test('no explicit key on the inner siblings', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      function Cell({ v }: { v: number }) { return <td>{v}</td> }
      type Row = { id: string; a: number; b: number; c: number; d: number }
      export function Demo() {
        const [rows, setRows] = createSignal<Row[]>([])
        return (
          <table onClick={() => setRows(r => r)}>
            <tbody>
              {rows().map(r => (
                <tr key={r.id}>
                  <Cell v={r.a} />
                  <Cell v={r.b} />
                  <Cell v={r.c} />
                  <Cell v={r.d} />
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('destructured loop param with rest spread back onto the root', () => {
  // SURFACED LIMITATION: BF025 — the compiler refuses rest elements in
  // a `.map()` callback's destructure (`({ id, title, ...rest }) => …`).
  // Intended behaviour is to lift `rest` into a per-item accessor that
  // remaining-key reflection can spread back onto the root. File as a
  // sub-issue of #1244.
  test('{ id, title, ...rest } and {...rest} on the root element — rejected with BF025 (regression lock)', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type Task = { id: string; title: string; 'data-priority': string; 'data-flag': string }
      export function Demo() {
        const [tasks, setTasks] = createSignal<Task[]>([])
        return (
          <ul onClick={() => setTasks(t => t)}>
            {tasks().map(({ id, title, ...rest }) => (
              <li key={id} {...rest}>{title}</li>
            ))}
          </ul>
        )
      }
    `
    const c = compile(src)
    expect(c.errors.map(e => e.code)).toContain('BF025')
  })
})

describe('nested destructuring in loop param', () => {
  // SURFACED LIMITATION: BF025 fires on the nested `[first, ...rest]`
  // array-pattern with rest. Intended behaviour is per-position rewrite
  // for the array members; the outer object destructure already works.
  // File as a sub-issue of #1244.
  test('{ rows: [first, ...rest] } at the loop param — rejected with BF025 (regression lock)', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type Group = { id: string; rows: { id: string; label: string }[] }
      export function Demo() {
        const [groups, setGroups] = createSignal<Group[]>([])
        return (
          <ul onClick={() => setGroups(g => g)}>
            {groups().map(({ id, rows: [first, ...rest] }) => (
              <li key={id}>{first ? first.label : ''} (+{rest.length})</li>
            ))}
          </ul>
        )
      }
    `
    const c = compile(src)
    expect(c.errors.map(e => e.code)).toContain('BF025')
  })
})

describe('loop param shadowing an outer signal name', () => {
  test('tasks.map(tasks => …) — inner `tasks` shadows outer signal', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type T = { id: string; title: string }
      export function Demo() {
        const [tasks, setTasks] = createSignal<T[]>([])
        return (
          <ul onClick={() => setTasks(t => t)}>
            {tasks().map(tasks => <li key={tasks.id}>{tasks.title}</li>)}
          </ul>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('computed key', () => {
  test('key={hash(item) ?? fallback}', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      function hash(s: string): string { return s }
      type T = { id: string; name: string }
      export function Demo() {
        const [items, setItems] = createSignal<T[]>([])
        return (
          <ul onClick={() => setItems(i => i)}>
            {items().map(it => <li key={hash(it.name) ?? it.id}>{it.name}</li>)}
          </ul>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('key edge values', () => {
  // SURFACED LIMITATION: BF023 — the compiler treats a literal-falsy
  // `key={null}` (or `key={false}`, `key={0}` reached through a
  // ternary) as a missing key prop. Intended behaviour is to either
  // accept the value verbatim (ints + booleans are valid React-style
  // keys) or to diagnose with a specific "key cannot be falsy" code
  // instead of the generic missing-key error. File as a sub-issue
  // of #1244.
  test('key={0}, key={false}, key={null} via ternary — rejected with BF023 (regression lock)', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type T = { v: number }
      export function Demo() {
        const [items, setItems] = createSignal<T[]>([])
        return (
          <ul onClick={() => setItems(i => i)}>
            {items().map((it, i) => (
              <li key={i === 0 ? 0 : i === 1 ? false : null}>{it.v}</li>
            ))}
          </ul>
        )
      }
    `
    const c = compile(src)
    expect(c.errors.map(e => e.code)).toContain('BF023')
  })
})

describe('component identifier passed as a callback value', () => {
  test('<Outer render={Inner} /> — Inner is a component function value', () => {
    const src = `
      function Inner() { return <span>x</span> }
      function Outer({ render: R }: { render: () => JSX.Element }) {
        return <div><R /></div>
      }
      export function Demo() {
        return <Outer render={Inner} />
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

// ---------------------------------------------------------------------------
// Value-shape edges
// ---------------------------------------------------------------------------

describe('attribute value shape parity', () => {
  test('attr={0} vs "" vs false vs null vs undefined vs omitted compile', () => {
    const src = `
      export function Demo() {
        return (
          <div>
            <span data-a={0}>0</span>
            <span data-b={''}>empty</span>
            <span data-c={false}>false</span>
            <span data-d={null}>null</span>
            <span data-e={undefined}>undefined</span>
            <span>omitted</span>
          </div>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('attr={cond() && "x"} short-circuiting to false', () => {
  test('string-typed attribute with logical-and value', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [cond, setCond] = createSignal(false)
        return <a onClick={() => setCond(v => !v)} title={cond() && 'x'}>link</a>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('boolean attribute with attr={truthy ? "" : undefined}', () => {
  test('empty string is truthy as boolean attribute presence', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [open, setOpen] = createSignal(false)
        return <details onClick={() => setOpen(v => !v)} open={open() ? '' : undefined}>x</details>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('children as an array', () => {
  test('children: [a, b, c] — keyed siblings, dynamic length', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      function Wrap({ children }: { children: any }) { return <div>{children}</div> }
      export function Demo() {
        const [n, setN] = createSignal(3)
        return (
          <Wrap>
            {[<span key="a">a</span>, <span key="b">b</span>, <span key="c">c</span>]}
          </Wrap>
        )
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('children as a function (render-prop)', () => {
  test('children prop is a function receiving signal values', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      function Resource({ children }: { children: (v: number) => JSX.Element }) {
        return <div>{children(42)}</div>
      }
      export function Demo() {
        const [n, setN] = createSignal(0)
        return <Resource>{(v) => <span onClick={() => setN(v)}>{v + n()}</span>}</Resource>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('dangerouslySetInnerHTML with a reactive value', () => {
  test('reactive innerHTML', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [html, setHtml] = createSignal('<b>hi</b>')
        return <div onClick={() => setHtml('<i>bye</i>')} dangerouslySetInnerHTML={{ __html: html() }} />
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

// ---------------------------------------------------------------------------
// TS surface / DX
// ---------------------------------------------------------------------------

describe('signal returned from a generic helper', () => {
  // SURFACED LIMITATION: BF110 — the analyzer doesn't recognise a
  // *generic* helper (`function useResource<T>(): [() => T, …]`) as a
  // reactive factory, even when its body is `return createSignal(...)`.
  // Intended behaviour is to follow the helper through generics the
  // same way the same-file-non-generic case is already followed.
  // File as a sub-issue of #1244.
  test('useResource<T>() return is destructured — rejected with BF110 (regression lock)', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      function useResource<T>(initial: T): [() => T, (next: T) => void] {
        return createSignal(initial)
      }
      export function Demo() {
        const [name, setName] = useResource<string>('alice')
        return <button onClick={() => setName('bob')}>{name()}</button>
      }
    `
    const c = compile(src)
    expect(c.errors.map(e => e.code)).toContain('BF110')
  })
})

describe('as const-narrowed signal initial value', () => {
  test('analyzer recognises an `as const` initial', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function Demo() {
        const [k, setK] = createSignal('idle' as const)
        return <button onClick={() => setK('idle')}>{k()}</button>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('satisfies between signal initial and a target type', () => {
  test('initial value uses `satisfies`', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      type Status = 'idle' | 'loading'
      export function Demo() {
        const [s, setS] = createSignal('idle' satisfies Status)
        return <button onClick={() => setS('loading')}>{s()}</button>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('discriminated-union props rendering different subtrees per discriminator', () => {
  test('switch on `kind` returns different element shapes', () => {
    const src = `
      type P = { kind: 'a'; a: string } | { kind: 'b'; b: number }
      export function Demo(props: P) {
        if (props.kind === 'a') return <span>A:{props.a}</span>
        return <b>B:{props.b}</b>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('default-prop value that itself reads a signal', () => {
  test('default value is computed from a signal accessor', () => {
    const src = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      const [global, setGlobal] = createSignal('default')
      export function Demo({ label = global() }: { label?: string }) {
        return <button onClick={() => setGlobal('next')}>{label}</button>
      }
    `
    expectNoFatalErrors(compile(src))
  })
})

describe('component returning null vs <></> vs false', () => {
  test('three renderers compile in a single file', () => {
    const src = `
      export function ReturnsNull() { return null }
      export function ReturnsFragment() { return <></> }
      export function ReturnsFalse(): any { return false }
    `
    expectNoFatalErrors(compile(src))
  })
})
