/**
 * Pins the shape of the `templatePrimitives` / `acceptsTemplateCall` API
 * added to `TemplateAdapter` (#1187 phase 0). These fields aren't yet
 * consulted by the compiler — this test only verifies the type plumbing
 * compiles and that adapters can declare registries without breaking the
 * existing interface.
 *
 * Behavioural wiring (relocate consults the registry, strict error fires
 * when a callee is unregistered, etc.) lands in subsequent phases.
 */

import { describe, test, expect } from 'bun:test'
import { TestAdapter } from '../adapters/test-adapter'
import type {
  TemplateAdapter,
  TemplatePrimitiveRegistry,
  TemplatePrimitiveEmit,
  TemplateCallAcceptor,
} from '../adapters/interface'

describe('TemplateAdapter.templatePrimitives (phase 0 type plumbing)', () => {
  test('existing adapters compile without declaring templatePrimitives', () => {
    // TestAdapter doesn't set the optional fields — must still satisfy the interface.
    const a: TemplateAdapter = new TestAdapter()
    expect(a.templatePrimitives).toBeUndefined()
    expect(a.acceptsTemplateCall).toBeUndefined()
  })

  test('an adapter can declare a registry of identifier-path callees', () => {
    const registry: TemplatePrimitiveRegistry = {
      'JSON.stringify': (args) => `JSON.stringify(${args[0]})`,
      'Math.floor': (args) => `Math.floor(${args[0]})`,
      'String': (args) => `String(${args[0]})`,
    }

    const emit: TemplatePrimitiveEmit = registry['JSON.stringify']
    expect(emit(['x'])).toBe('JSON.stringify(x)')
    expect(registry['Math.floor'](['1.5'])).toBe('Math.floor(1.5)')
  })

  test('an adapter can declare a broad-acceptance predicate (full JS runtime)', () => {
    // Hono / CSR-style: accept anything that isn't an obvious DOM/async leak.
    // Predicate semantics are MVP-loose for now; refinement is downstream work.
    const acceptsTemplateCall: TemplateCallAcceptor = (callee) => !callee.startsWith('document.')

    expect(acceptsTemplateCall('JSON.stringify')).toBe(true)
    expect(acceptsTemplateCall('Math.floor')).toBe(true)
    expect(acceptsTemplateCall('document.querySelector')).toBe(false)
  })

  test('a server-template adapter declares only an explicit registry (no acceptor)', () => {
    // Go-template-style: explicit list, no broad acceptance.
    const registry: TemplatePrimitiveRegistry = {
      'JSON.stringify': (args) => `{{ json ${args[0]} }}`,
    }

    // Shape check via assignment — the absence of acceptsTemplateCall is the point.
    const partial: Pick<TemplateAdapter, 'templatePrimitives' | 'acceptsTemplateCall'> = {
      templatePrimitives: registry,
    }

    expect(partial.templatePrimitives).toBeDefined()
    expect(partial.acceptsTemplateCall).toBeUndefined()
  })
})
