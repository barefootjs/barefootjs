import { describe, expect, test } from 'bun:test'
import { RELATIVE_IMPORT_RE } from '../lib/patterns'

function matchAll(input: string) {
  return [...input.matchAll(RELATIVE_IMPORT_RE)]
}

describe('RELATIVE_IMPORT_RE', () => {
  describe('matches relative imports', () => {
    test('named import', () => {
      const m = matchAll(`import { foo } from './bar'`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./bar')
    })

    test('default import', () => {
      const m = matchAll(`import Foo from './bar'`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./bar')
    })

    test('namespace import', () => {
      const m = matchAll(`import * as Foo from './bar'`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./bar')
    })

    test('side-effect import', () => {
      const m = matchAll(`import './bar'`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./bar')
    })

    test('mixed default + named import', () => {
      const m = matchAll(`import Foo, { bar } from './baz'`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./baz')
    })

    test('with trailing semicolon', () => {
      const m = matchAll(`import { foo } from './bar';`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./bar')
    })

    test('without trailing semicolon', () => {
      const m = matchAll(`import { foo } from './bar'`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./bar')
    })

    test('parent directory path', () => {
      const m = matchAll(`import { foo } from '../shared/utils'`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('../shared/utils')
    })

    test('double quotes', () => {
      const m = matchAll(`import { foo } from "./bar"`)
      expect(m).toHaveLength(1)
      expect(m[0][1]).toBe('./bar')
    })
  })

  describe('does not match non-relative imports', () => {
    test('package import', () => {
      const m = matchAll(`import { createSignal } from '@barefootjs/client'`)
      expect(m).toHaveLength(0)
    })

    test('bare specifier', () => {
      const m = matchAll(`import shiki from 'shiki'`)
      expect(m).toHaveLength(0)
    })
  })

  describe('multiline content', () => {
    test('matches multiple relative imports in multiline content', () => {
      const input = [
        `import { createSignal } from '@barefootjs/client'`,
        `import { foo } from './foo'`,
        `import Bar from './bar'`,
        `import './side-effect'`,
        `import shiki from 'shiki'`,
      ].join('\n')

      const m = matchAll(input)
      expect(m).toHaveLength(3)
      expect(m[0][1]).toBe('./foo')
      expect(m[1][1]).toBe('./bar')
      expect(m[2][1]).toBe('./side-effect')
    })
  })
})
