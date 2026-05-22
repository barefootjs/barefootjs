import { describe, test, expect } from 'bun:test'
import { CSRAdapter, createConfig } from '../src/build'

describe('client/build createConfig', () => {
  test("default adapter is `CSRAdapter` and announces itself as 'csr'", () => {
    const config = createConfig({})
    expect(config.adapter).toBeInstanceOf(CSRAdapter)
    expect(config.adapter.name).toBe('csr')
  })

  test('caller-supplied adapter is left untouched', () => {
    const custom = new CSRAdapter({ name: 'custom-thing' })
    const config = createConfig({ adapter: custom })
    expect(config.adapter).toBe(custom)
    expect(config.adapter.name).toBe('custom-thing')
  })

  test('caller-supplied adapterOptions.name wins over the csr default', () => {
    const config = createConfig({ adapterOptions: { name: 'explicit' } })
    expect(config.adapter.name).toBe('explicit')
  })

  test('clientOnly is set', () => {
    const config = createConfig({})
    expect(config.clientOnly).toBe(true)
  })

  test('CSRAdapter exposes the broad `acceptsTemplateCall` predicate', () => {
    const adapter = new CSRAdapter()
    expect(adapter.acceptsTemplateCall?.('JSON.stringify')).toBe(true)
    expect(adapter.acceptsTemplateCall?.('Math.random')).toBe(true)
    expect(adapter.acceptsTemplateCall?.('anyArbitraryName')).toBe(true)
  })

  test('CSRAdapter.generate() returns an empty AdapterOutput', () => {
    const adapter = new CSRAdapter()
    const out = adapter.generate()
    expect(out.template).toBe('')
    expect(out.sections.imports).toBe('')
    expect(out.sections.types).toBe('')
    expect(out.sections.component).toBe('')
    expect(out.sections.defaultExport).toBe('')
  })
})
