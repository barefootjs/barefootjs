import { describe, test, expect } from 'bun:test'
import { HonoAdapter } from '@barefootjs/hono/adapter'
import { createConfig } from '../src/build'

describe('client/build createConfig', () => {
  test("default adapter announces itself as 'csr'", () => {
    const config = createConfig({})
    expect((config.adapter as HonoAdapter).name).toBe('csr')
  })

  test('caller-supplied adapter is left untouched', () => {
    const custom = new HonoAdapter({ name: 'custom-thing' })
    const config = createConfig({ adapter: custom })
    expect((config.adapter as HonoAdapter).name).toBe('custom-thing')
  })

  test('caller-supplied adapterOptions.name wins over the csr default', () => {
    const config = createConfig({ adapterOptions: { name: 'explicit' } })
    expect((config.adapter as HonoAdapter).name).toBe('explicit')
  })

  test('clientOnly is set', () => {
    const config = createConfig({})
    expect(config.clientOnly).toBe(true)
  })
})
