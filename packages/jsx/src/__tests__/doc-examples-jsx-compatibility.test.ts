/**
 * Doc Examples — JSX Compatibility (v1, #1439)
 *
 * Mechanically validates that the fenced code examples in
 * `docs/core/rendering/jsx-compatibility.md` still compile (or fail
 * with the documented BFxxx code) on the current compiler.
 *
 * Prompted by #1434 — `.filter().map()` with a block-body predicate
 * silently dropped the `.filter()` even though that exact shape is
 * documented as supported. A documented pattern that silently breaks
 * is the worst case for end-user trust, so this test treats each doc
 * example as a contract.
 *
 * v1 scope (this file): one page (jsx-compatibility.md), one adapter
 * (TestAdapter — Hono-like baseline). The `// ❌ BFxxx on Go/Mojo;
 * works on Hono` examples assert *positive* here — the cross-adapter
 * check (Go / Mojo actually raising BFxxx) is a follow-up once the v1
 * mechanism is proven.
 *
 * Examples containing markdown shorthand are skipped with a recorded
 * reason and triaged separately:
 *   - `(...)` placeholder, e.g. `.map(...)`
 *   - `>...<` text-content placeholder
 *   - statement-body (first non-ws token isn't `{` or `<`)
 */

import { describe, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const DOC_PATH = resolve(
  __dirname,
  '../../../../docs/core/rendering/jsx-compatibility.md',
)

type Expected =
  | { kind: 'positive' }
  | { kind: 'negative-all-adapters'; code: string }
  | { kind: 'negative-go-mojo-only'; code: string }

interface DocExample {
  label: string
  startLine: number
  expected: Expected
  body: string
  skipReason?: string
}

function parseExpected(labelLine: string): Expected {
  const text = labelLine.replace(/^\s*\/\/\s*/, '')
  const allAdapters = text.match(/❌\s*(BF\d+)\s*\(all adapters\)/)
  if (allAdapters) return { kind: 'negative-all-adapters', code: allAdapters[1] }
  const goMojo = text.match(/❌\s*(BF\d+)\s+on Go\/Mojo/)
  if (goMojo) return { kind: 'negative-go-mojo-only', code: goMojo[1] }
  const anyNegative = text.match(/❌\s*(BF\d+)/)
  if (anyNegative) return { kind: 'negative-all-adapters', code: anyNegative[1] }
  return { kind: 'positive' }
}

function detectSkipReason(body: string): string | undefined {
  if (/\(\s*\.\.\.\s*\)/.test(body)) return 'contains `(...)` placeholder'
  if (/>\s*\.\.\.\s*</.test(body)) return 'contains `>...<` placeholder'
  const firstChar = body.trim().charAt(0)
  if (firstChar !== '{' && firstChar !== '<') {
    return 'statement-body (not an expression / element)'
  }
  return undefined
}

function extractExamples(md: string): DocExample[] {
  const lines = md.split('\n')
  const examples: DocExample[] = []

  let i = 0
  while (i < lines.length) {
    if (!/^```tsx\s*$/.test(lines[i])) {
      i++
      continue
    }

    const fenceLineNumber = i + 1
    let j = i + 1
    while (j < lines.length && !/^```\s*$/.test(lines[j])) j++

    const blockLines = lines.slice(i + 1, j)
    const segments: Array<{ offset: number; lines: string[] }> = []
    let cur: { offset: number; lines: string[] } | null = null

    blockLines.forEach((ln, idx) => {
      if (/^\s*\/\//.test(ln)) {
        if (cur && cur.lines.some(l => l.trim() !== '')) segments.push(cur)
        cur = { offset: idx, lines: [ln] }
      } else {
        if (!cur) cur = { offset: idx, lines: [] }
        cur.lines.push(ln)
      }
    })
    if (cur && cur.lines.some(l => l.trim() !== '')) segments.push(cur)

    for (const seg of segments) {
      const hasLabel = /^\s*\/\//.test(seg.lines[0])
      const labelLine = hasLabel ? seg.lines[0] : ''
      const bodyLines = hasLabel ? seg.lines.slice(1) : seg.lines
      const body = bodyLines.join('\n').trim()
      if (body === '') continue
      const label = hasLabel
        ? labelLine.replace(/^\s*\/\/\s*/, '').trim() || '(empty label)'
        : '(no label)'
      const startLine =
        fenceLineNumber + 1 + seg.offset + (hasLabel ? 1 : 0)
      const expected = parseExpected(labelLine)
      const skipReason = detectSkipReason(body)
      examples.push({ label, startLine, expected, body, skipReason })
    }

    i = j + 1
  }
  return examples
}

const SCAFFOLD_HEADER = `'use client'
import { createSignal } from '@barefootjs/client'

function TodoItem(props: { todo: any; key?: any }) { return <li>{String(props.todo)}</li> }
function Item(props: { item: any; key?: any }) { return <li>{String(props.item)}</li> }
function Dashboard() { return <div>D</div> }

export function Example() {
  const [count, setCount] = createSignal(0)
  const [isLoggedIn] = createSignal(false)
  const [todos] = createSignal<Array<{ id: number; done: boolean; name: string }>>([])
  const [items] = createSignal<Array<{ id: number; active: boolean; done: boolean; price: number; name: string; tags: Array<{ active: boolean }> }>>([])
  const [filter] = createSignal<'all' | 'active' | 'completed'>('all')
  const [accepted] = createSignal(false)
  const [text, setText] = createSignal('')
  const status: string = 'empty'
  const handleSubmit = () => {}
  return (
    <div>
`

const SCAFFOLD_FOOTER = `
    </div>
  )
}
`

function buildSource(example: DocExample): string {
  return SCAFFOLD_HEADER + example.body + SCAFFOLD_FOOTER
}

const adapter = new TestAdapter()

function compileOnce(source: string) {
  const result = compileJSX(source, 'DocExample.tsx', { adapter })
  return result.errors.filter(e => e.severity === 'error')
}

describe('docs/core/rendering/jsx-compatibility.md doc-examples', () => {
  const md = readFileSync(DOC_PATH, 'utf8')
  const examples = extractExamples(md)

  test('extractor returned a non-empty set of examples', () => {
    if (examples.length === 0) {
      throw new Error(
        'extractor returned zero examples — has the markdown structure changed?',
      )
    }
  })

  for (const ex of examples) {
    const name = `L${ex.startLine} — ${ex.label}`

    if (ex.skipReason) {
      test.skip(`${name}  [skip: ${ex.skipReason}]`, () => {})
      continue
    }

    test(name, () => {
      const source = buildSource(ex)
      const fatals = compileOnce(source)

      switch (ex.expected.kind) {
        case 'positive':
        case 'negative-go-mojo-only': {
          if (fatals.length > 0) {
            const dump = fatals
              .map(e => `  ${e.code}: ${e.message}`)
              .join('\n')
            throw new Error(
              `expected no fatal errors on TestAdapter, got:\n${dump}\n--- source ---\n${source}`,
            )
          }
          return
        }
        case 'negative-all-adapters': {
          const code = ex.expected.code
          const matched = fatals.find(e => e.code === code)
          if (!matched) {
            const got = fatals.map(e => e.code).join(', ') || '(none)'
            throw new Error(
              `expected error ${code}, got: ${got}\n--- source ---\n${source}`,
            )
          }
          const unexpected = fatals.filter(e => e.code !== code)
          if (unexpected.length > 0) {
            const dump = unexpected
              .map(e => `  ${e.code}: ${e.message}`)
              .join('\n')
            throw new Error(
              `expected only ${code}, but got additional fatal errors:\n${dump}\n--- source ---\n${source}`,
            )
          }
          return
        }
      }
    })
  }
})
