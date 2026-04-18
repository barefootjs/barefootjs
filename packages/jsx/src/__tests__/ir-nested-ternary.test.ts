import { describe, test, expect } from 'bun:test'
import { compileJSXSync } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

describe('nested ternary (#495)', () => {
  test('compiles all branches of nested ternary', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function StatusBadge() {
        const [status, setStatus] = createSignal('idle')
        return <div>{status() === 'loading' ? <span>Loading</span> : status() === 'error' ? <span>Error</span> : <span>Idle</span>}</div>
      }
    `

    const result = compileJSXSync(source, 'StatusBadge.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    // No raw JSX should remain in the compiled output
    expect(clientJs!.content).not.toContain('<span>Loading</span>')
    expect(clientJs!.content).not.toContain('<span>Error</span>')
    expect(clientJs!.content).not.toContain('<span>Idle</span>')
  })

  test('compiles deeply nested ternary (3+ levels)', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function DeepTernary() {
        const [v, setV] = createSignal(0)
        return <div>{v() === 1 ? <span>One</span> : v() === 2 ? <span>Two</span> : v() === 3 ? <span>Three</span> : <span>Other</span>}</div>
      }
    `

    const result = compileJSXSync(source, 'DeepTernary.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    expect(clientJs!.content).not.toContain('<span>One</span>')
    expect(clientJs!.content).not.toContain('<span>Two</span>')
    expect(clientJs!.content).not.toContain('<span>Three</span>')
    expect(clientJs!.content).not.toContain('<span>Other</span>')
  })

  test('compiles stateless nested ternary without errors', () => {
    const source = `
      export function StaticNested(props: { status: string }) {
        return <div>{props.status === 'a' ? <span>A</span> : props.status === 'b' ? <span>B</span> : <span>C</span>}</div>
      }
    `

    const result = compileJSXSync(source, 'StaticNested.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    // Stateless components produce JSX templates — verify template is generated
    const template = result.files.find(f => f.type === 'markedTemplate')
    expect(template).toBeDefined()
    // The nested ternary should produce two conditional expressions in the template
    expect(template!.content).toContain("props.status === 'a'")
    expect(template!.content).toContain("props.status === 'b'")
  })

  test('compiles logical AND inside ternary branch', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'
      export function AndInBranch() {
        const [a, setA] = createSignal(false)
        const [b, setB] = createSignal(false)
        return <div>{a() ? <span>A</span> : b() && <span>B</span>}</div>
      }
    `

    const result = compileJSXSync(source, 'AndInBranch.tsx', { adapter })
    expect(result.errors).toHaveLength(0)

    const clientJs = result.files.find(f => f.type === 'clientJs')
    expect(clientJs).toBeDefined()
    expect(clientJs!.content).not.toContain('<span>A</span>')
    expect(clientJs!.content).not.toContain('<span>B</span>')
  })
})
