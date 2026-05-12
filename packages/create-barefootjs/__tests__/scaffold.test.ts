// Full end-to-end scaffold I/O. This drives `create-barefootjs` all the
// way through `barefoot init`, which requires reaching the BarefootJS UI
// registry over the network. Gate the suite behind an env flag so the
// default `bun test` run stays offline-friendly.
//
//   BAREFOOT_CREATE_INTEGRATION=1 bun test scaffold.test.ts

import { describe, test, expect } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { mktmp, runCreate } from './helpers'

const INTEGRATION = process.env.BAREFOOT_CREATE_INTEGRATION === '1'

describe.skipIf(!INTEGRATION)('scaffold I/O (integration)', () => {
  test('writes the expected starter files and a valid package.json', () => {
    const cwd = mktmp()
    const r = runCreate(['acme-app'], { cwd })

    expect(r.stderr).toBe('')
    expect(r.exitCode).toBe(0)

    const target = path.join(cwd, 'acme-app')
    const expectedFiles = [
      'server.tsx',
      'factory.ts',
      'renderer.tsx',
      'barefoot.config.ts',
      'tsconfig.json',
      'uno.config.ts',
      'components/Counter.tsx',
      'public/styles.css',
      'public/tokens.css',
      'public/uno.css',
      'dist/components/manifest.json',
      'meta/index.json',
      'package.json',
      'components/ui/button/index.tsx',
      'components/ui/slot/index.tsx',
      'types/index.tsx',
    ]
    for (const f of expectedFiles) {
      expect(existsSync(path.join(target, f))).toBe(true)
    }

    const pkg = JSON.parse(readFileSync(path.join(target, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('acme-app')
    expect(pkg.type).toBe('module')
    expect(pkg.scripts.dev).toBeString()
    expect(pkg.scripts.build).toBeString()
    expect(pkg.scripts.start).toBeString()
    // Adapter defaults to Hono — both the adapter package and Hono runtime
    // deps should be wired in.
    expect(pkg.dependencies['@barefootjs/cli']).toBeDefined()
    expect(pkg.dependencies['@barefootjs/hono']).toBeDefined()
    expect(pkg.dependencies['hono']).toBeDefined()
  })

  test('defaults the project name to my-barefoot-app when omitted', () => {
    const cwd = mktmp()
    const r = runCreate([], { cwd })

    expect(r.exitCode).toBe(0)
    const target = path.join(cwd, 'my-barefoot-app')
    expect(existsSync(path.join(target, 'package.json'))).toBe(true)
    const pkg = JSON.parse(readFileSync(path.join(target, 'package.json'), 'utf-8'))
    expect(pkg.name).toBe('my-barefoot-app')
  })

  test('forwards --adapter to barefoot init and rejects unknown adapters', () => {
    const cwd = mktmp()
    const r = runCreate(['acme-app', '--adapter', 'no-such-adapter'], { cwd })
    expect(r.exitCode).not.toBe(0)
    expect(r.stderr).toContain('unknown adapter')
  })
})
