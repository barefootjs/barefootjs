/**
 * End-to-end runtime tests for #1665: whole-item conditionals in loops.
 *
 * `arr.map(t => cond(t) && <li/>)` makes the conditional the entire loop
 * item. Compile the component with the real compiler, register its
 * template+init via `hydrate`, mount via `createComponent`, then flip the
 * signal the condition depends on and assert the DOM toggles per item.
 *
 * Covers fidelity parity: a static `const` array and a dynamic signal array
 * with the SAME body shape must behave identically.
 */
import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { compileJSX } from '../../../jsx/src/compiler'
import { TestAdapter } from '../../../jsx/src/adapters/test-adapter'
import { writeFileSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

beforeAll(() => {
  if (typeof window === 'undefined') GlobalRegistrator.register()
})

const adapter = new TestAdapter()

async function mount(source: string, filename: string, name: string): Promise<HTMLElement> {
  const result = compileJSX(source, filename, { adapter })
  const errors = result.errors.filter((e) => e.severity === 'error')
  if (errors.length > 0) {
    throw new Error(`Compile errors in ${filename}:\n${errors.map((e) => `${e.code}: ${e.message}`).join('\n')}`)
  }
  const clientJs = result.files.find((f) => f.type === 'clientJs')?.content
  if (!clientJs) throw new Error('No client JS emitted')
  const runtimePath = join(__dirname, '../../src/runtime/index.ts')
  const rewritten = clientJs
    .replace(/from\s+['"]@barefootjs\/client\/runtime['"]/g, `from '${runtimePath}'`)
    .replace(/^import '\/\* @bf-child:\w+ \*\/'\n/gm, '')
  const dir = mkdtempSync(join(tmpdir(), 'bf-1665-'))
  const file = join(dir, `${filename.replace(/\W/g, '_')}.mjs`)
  writeFileSync(file, rewritten)
  await import(file)
  const { createComponent } = await import(runtimePath)
  const el = createComponent(name, {}) as HTMLElement
  document.body.appendChild(el)
  return el
}

const texts = (el: HTMLElement, sel = 'li') =>
  Array.from(el.querySelectorAll(sel)).map((n) => n.textContent)

describe('#1665 — whole-item loop conditional toggles per item', () => {
  beforeEach(() => { document.body.innerHTML = '' })

  test('dynamic signal array: && item appears/disappears on toggle', async () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function DynList() {
        const [items] = createSignal([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
        const [sel, setSel] = createSignal('a')
        return (
          <div>
            <button onClick={() => setSel('b')}>toB</button>
            <ul>{items().map(t => sel() === t.id && <li key={t.id}>{t.id}</li>)}</ul>
          </div>
        )
      }
    `
    const el = await mount(source, 'DynList.tsx', 'DynList')
    expect(texts(el)).toEqual(['a'])
    el.querySelector('button')!.dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(texts(el)).toEqual(['b'])
  })

  test('ternary-with-null body (cond ? <li> : null) toggles per item', async () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function TernList() {
        const [items] = createSignal([{ id: 'a' }, { id: 'b' }, { id: 'c' }])
        const [sel, setSel] = createSignal('a')
        return (
          <div>
            <button onClick={() => setSel('c')}>toC</button>
            <ul>{items().map(t => sel() === t.id ? <li key={t.id}>{t.id}</li> : null)}</ul>
          </div>
        )
      }
    `
    const el = await mount(source, 'TernList.tsx', 'TernList')
    expect(texts(el)).toEqual(['a'])
    el.querySelector('button')!.dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(texts(el)).toEqual(['c'])
  })

  test('logical-or body (expr || <li>) renders the element when left is falsy', async () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function OrList() {
        const [items] = createSignal([{ id: 'a', hidden: false }, { id: 'b', hidden: true }, { id: 'c', hidden: false }])
        return <ul>{items().map(t => t.hidden || <li key={t.id}>{t.id}</li>)}</ul>
      }
    `
    const el = await mount(source, 'OrList.tsx', 'OrList')
    // 'b' is hidden (left truthy) → renders nothing; 'a' and 'c' render.
    expect(texts(el)).toEqual(['a', 'c'])
  })

  test('array add / remove keeps per-item conditionals correct', async () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function GrowList() {
        const [items, setItems] = createSignal([{ id: 'a' }, { id: 'b' }])
        const [sel] = createSignal('b')
        return (
          <div>
            <button onClick={() => setItems([{ id: 'a' }, { id: 'b' }, { id: 'c' }])}>add</button>
            <ul>{items().map(t => sel() === t.id && <li key={t.id}>{t.id}</li>)}</ul>
          </div>
        )
      }
    `
    const el = await mount(source, 'GrowList.tsx', 'GrowList')
    expect(texts(el)).toEqual(['b'])
    el.querySelector('button')!.dispatchEvent(new window.Event('click', { bubbles: true }))
    // Adding 'c' must not disturb 'b' still being the only rendered <li>.
    expect(texts(el)).toEqual(['b'])
  })

  test('static const array: same body shape behaves identically', async () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      const THEMES = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
      export function StaticList() {
        const [sel, setSel] = createSignal('a')
        return (
          <div>
            <button onClick={() => setSel('b')}>toB</button>
            <ul>{THEMES.map(t => sel() === t.id && <li key={t.id}>{t.id}</li>)}</ul>
          </div>
        )
      }
    `
    const el = await mount(source, 'StaticList.tsx', 'StaticList')
    expect(texts(el)).toEqual(['a'])
    el.querySelector('button')!.dispatchEvent(new window.Event('click', { bubbles: true }))
    expect(texts(el)).toEqual(['b'])
  })
})
