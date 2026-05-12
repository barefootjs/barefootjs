import { describe, test, expect } from 'bun:test'
import { ADAPTERS, DEFAULT_ADAPTER, CSS_LIBRARIES, DEFAULT_CSS_LIBRARY } from '../lib/templates'

describe('adapter registry', () => {
  test('default adapter is registered', () => {
    expect(ADAPTERS[DEFAULT_ADAPTER]).toBeDefined()
  })

  test('default adapter is hono', () => {
    expect(DEFAULT_ADAPTER).toBe('hono')
  })

  test.each(['hono', 'hono-node', 'echo', 'mojo', 'csr'])('%s adapter is registered', id => {
    expect(ADAPTERS[id]).toBeDefined()
  })

  test('hono and hono-node disambiguate via shortLabel in confirmation', () => {
    // Both have "Hono" as the root noun, so the menu confirmation
    // would collapse to the same word without an explicit shortLabel.
    expect(ADAPTERS.hono.shortLabel).toBe('Hono / Cloudflare Workers')
    expect(ADAPTERS['hono-node'].shortLabel).toBe('Hono / Node')
  })

  test('only hono (Cloudflare Workers) advertises a deploy story', () => {
    // The CW variant has a one-command deploy via wrangler; the Node
    // variant doesn't bind to a specific host so init suppresses the
    // post-scaffold Deploy section.
    expect(ADAPTERS.hono.deploy?.target).toBe('Cloudflare Workers')
    expect(ADAPTERS['hono-node'].deploy).toBeUndefined()
  })

  test('hono-node ships an editable dev-reload component', () => {
    // The dev-reload subscriber lives in the generated project (not
    // imported from @barefootjs/hono) so users can re-route the SSE
    // endpoint with a single in-project edit.
    const honoNode = ADAPTERS['hono-node']
    expect(honoNode.files['dev-reload.tsx']).toBeTruthy()
    expect(honoNode.files['dev-reload.tsx']).toContain('EventSource')
    expect(honoNode.files['dev-reload.tsx']).toContain('/_bf/reload')
    expect(honoNode.files['dev-reload.tsx']).toContain('export function DevReload')
    // renderer.tsx wires it up, not BfDevReload from the library.
    expect(honoNode.files['renderer.tsx']).toContain("from './dev-reload'")
    expect(honoNode.files['renderer.tsx']).not.toContain('BfDevReload')
  })

  test('every adapter has a label, port, and barefoot.config.ts file', () => {
    for (const [id, adapter] of Object.entries(ADAPTERS)) {
      expect(adapter.label, `${id} missing label`).toBeTruthy()
      expect(adapter.port, `${id} missing port`).toBeGreaterThan(0)
      expect(adapter.files['barefoot.config.ts'], `${id} missing barefoot.config.ts`).toBeTruthy()
    }
  })

  test('every adapter contributes a Counter component', () => {
    for (const [id, adapter] of Object.entries(ADAPTERS)) {
      expect(
        adapter.files['components/Counter.tsx'],
        `${id} missing components/Counter.tsx`,
      ).toBeTruthy()
    }
  })

  test('echo bundles the vendored Go runtime', () => {
    const echo = ADAPTERS.echo
    expect(echo.files['bf-runtime/bf.go']).toMatch(/package bf/)
    expect(echo.files['bf-runtime/streaming.go']).toBeTruthy()
    expect(echo.files['bf-runtime/go.mod']).toMatch(/^module github\.com\/barefootjs\/runtime\/bf/m)
    expect(echo.files['go.mod']).toMatch(/replace github\.com\/barefootjs\/runtime\/bf => \.\/bf-runtime/)
  })

  test('mojo bundles the vendored Perl plugin', () => {
    const mojo = ADAPTERS.mojo
    expect(mojo.files['lib/BarefootJS.pm']).toMatch(/^package BarefootJS;/m)
    expect(mojo.files['lib/Mojolicious/Plugin/BarefootJS.pm']).toMatch(/^package Mojolicious::Plugin::BarefootJS;/m)
    expect(mojo.files['cpanfile']).toMatch(/^requires 'Mojolicious'/m)
  })

  test('csr scaffolds a static HTML page + Bun server', () => {
    const csr = ADAPTERS.csr
    expect(csr.files['server.ts']).toMatch(/Bun\.serve/)
    expect(csr.files['pages/index.html']).toMatch(/<div id="app">/)
    expect(csr.files['pages/index.html']).toMatch(/@barefootjs\/client\/runtime/)
    expect(csr.files['barefoot.config.ts']).toMatch(/@barefootjs\/client\/build/)
  })
})

describe('CSS library registry', () => {
  test('default CSS library is registered', () => {
    expect(CSS_LIBRARIES[DEFAULT_CSS_LIBRARY]).toBeDefined()
  })

  test('default CSS library is unocss', () => {
    expect(DEFAULT_CSS_LIBRARY).toBe('unocss')
  })

  test('every CSS library entry has a label', () => {
    for (const [id, lib] of Object.entries(CSS_LIBRARIES)) {
      expect(lib.label, `CSS library ${id} missing label`).toBeTruthy()
    }
  })
})
