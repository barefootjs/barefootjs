// Tests for piconic-ai/barefootjs#1542 — when the combine step pulls in
// child component content that was already processed by a prior
// resolveRelativeImports pass, the stale __bf_inline_N identifiers in
// the combined file must not collide with freshly-assigned ones.

import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { resolveRelativeImports } from '../lib/resolve-imports'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { resolve } from 'path'
import { tmpdir } from 'os'

const TEST_DIR = resolve(tmpdir(), `bf-test-stale-combine-${Date.now()}`)
const DIST_DIR = resolve(TEST_DIR, 'dist')
const COMPONENTS_DIR = resolve(DIST_DIR, 'components')

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
  mkdirSync(COMPONENTS_DIR, { recursive: true })
})

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('resolveRelativeImports — stale inline identifiers (bf#1542)', () => {
  test('content with existing __bf_inline_N from combine: new inlines must not collide', async () => {
    writeFileSync(
      resolve(COMPONENTS_DIR, 'helper.ts'),
      `export function helper() { return 'helped' }
`,
    )

    const combinedContent = `const __bf_inline_0 = (() => {
function childHelper() { return 'child-helped' }
return { childHelper };
})();
const { childHelper } = __bf_inline_0;

import { helper } from './helper'
function init() { return { a: childHelper(), b: helper() } }
globalThis.__test_init = init
`
    writeFileSync(resolve(COMPONENTS_DIR, 'App.client.js'), combinedContent)

    const manifest = {
      App: {
        clientJs: 'components/App.client.js',
        markedTemplate: 'components/App.tsx',
      },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'App.client.js')).text()

    const ids = [...result.matchAll(/const (__bf_inline_\d+)\s*=\s*\(\(\) =>/g)].map(m => m[1])
    expect(new Set(ids).size).toBe(ids.length)
    expect(() => new Function(result)).not.toThrow()

    const fn = new Function(result + '; return globalThis.__test_init()')
    const out = fn()
    expect(out.a).toBe('child-helped')
    expect(out.b).toBe('helped')
  })

  test('content with multiple stale __bf_inline_N: new inlines offset correctly', async () => {
    writeFileSync(
      resolve(COMPONENTS_DIR, 'modA.ts'),
      `export const valA = 'a-value'
`,
    )
    writeFileSync(
      resolve(COMPONENTS_DIR, 'modB.ts'),
      `export const valB = 'b-value'
`,
    )

    const combinedContent = `const __bf_inline_0 = (() => {
const stale0 = 'stale0';
return { stale0 };
})();
const __bf_inline_1 = (() => {
const stale1 = 'stale1';
return { stale1 };
})();
const __bf_inline_2 = (() => {
const stale2 = 'stale2';
return { stale2 };
})();
const { stale0 } = __bf_inline_0;
const { stale1 } = __bf_inline_1;
const { stale2 } = __bf_inline_2;

import { valA } from './modA'
import { valB } from './modB'
function init() { return { stale0, stale1, stale2, valA, valB } }
globalThis.__test_init = init
`
    writeFileSync(resolve(COMPONENTS_DIR, 'App2.client.js'), combinedContent)

    const manifest = {
      App2: {
        clientJs: 'components/App2.client.js',
        markedTemplate: 'components/App2.tsx',
      },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'App2.client.js')).text()

    const ids = [...result.matchAll(/const (__bf_inline_\d+)\s*=\s*\(\(\) =>/g)].map(m => m[1])
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(5)
    expect(() => new Function(result)).not.toThrow()

    const fn = new Function(result + '; return globalThis.__test_init()')
    const out = fn()
    expect(out.stale0).toBe('stale0')
    expect(out.valA).toBe('a-value')
    expect(out.valB).toBe('b-value')
  })
})
