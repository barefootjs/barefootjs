/**
 * Boundary contract tests for `dispatchNodeType` — the helper that
 * `FlowNodeTypeBridge` funnels imperative and JSX-component shim
 * `nodeTypes` entries through. Without these tests, the IR test in
 * `ui/components/ui/xyflow/index.test.tsx` only verifies the bridge's
 * structural shape (signals, memos, effect count) — the `instanceof Node`
 * branch lives inside the effect body where IR analysis can't see it.
 *
 * Regression guard for piconic-ai/barefootjs#1236 (xyflow: nodeTypes
 * map can't accept 'use client' JSX components).
 */

import { beforeAll, describe, expect, test } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register()
})

describe('dispatchNodeType', () => {
  test('imperative entry: mutates the host via `this`, returns void', async () => {
    const { dispatchNodeType } = await import('../node-type-dispatch')

    const host = document.createElement('div')

    const imperative: (this: HTMLElement, props: { id: string }) => void = function (props) {
      const child = document.createElement('span')
      child.textContent = `imperative:${props.id}`
      this.appendChild(child)
    }

    dispatchNodeType(host, imperative as never, { id: 'a' } as never)

    expect(host.children).toHaveLength(1)
    expect(host.firstChild?.textContent).toBe('imperative:a')
  })

  test("JSX-component shim entry: returned Node is appended to the host (the #1236 contract)", async () => {
    const { dispatchNodeType } = await import('../node-type-dispatch')

    const host = document.createElement('div')

    // Mirrors the bundler-emitted shim shape for a `'use client'` `.tsx`
    // component: ignores `this`, returns a DOM `Node`.
    const jsxShim: (this: HTMLElement, props: { id: string }) => Node = (props) => {
      const node = document.createElement('div')
      node.textContent = `jsx:${props.id}`
      return node
    }

    dispatchNodeType(host, jsxShim as never, { id: 'b' } as never)

    expect(host.children).toHaveLength(1)
    expect(host.firstChild?.textContent).toBe('jsx:b')
  })

  test('JSX-component shim returning a DocumentFragment unwraps into the host', async () => {
    const { dispatchNodeType } = await import('../node-type-dispatch')

    const host = document.createElement('div')

    // `createComponent` shims that produce multiple top-level nodes
    // wrap them in a DocumentFragment. `appendChild` of a fragment
    // unwraps its children into the host — this exercise pins that
    // behaviour so a future "only HTMLElement" tightening of the
    // guard is caught.
    const fragmentShim: () => Node = () => {
      const frag = document.createDocumentFragment()
      const a = document.createElement('span')
      a.textContent = 'one'
      const b = document.createElement('span')
      b.textContent = 'two'
      frag.appendChild(a)
      frag.appendChild(b)
      return frag
    }

    dispatchNodeType(host, fragmentShim as never, {} as never)

    expect(host.children).toHaveLength(2)
    expect(host.children[0]?.textContent).toBe('one')
    expect(host.children[1]?.textContent).toBe('two')
  })

  test('non-Node return value is ignored (imperative entries that accidentally return a primitive)', async () => {
    const { dispatchNodeType } = await import('../node-type-dispatch')

    const host = document.createElement('div')

    // Defensive: an imperative entry that accidentally returns a
    // non-Node value (e.g. a number from a `.forEach` chain) MUST NOT
    // trigger an `appendChild` — the `instanceof Node` guard is the
    // only thing keeping the imperative path safe.
    const stray: (this: HTMLElement) => unknown = function () {
      this.dataset.touched = '1'
      return 42
    }

    dispatchNodeType(host, stray as never, {} as never)

    expect(host.dataset.touched).toBe('1')
    expect(host.children).toHaveLength(0)
  })
})
