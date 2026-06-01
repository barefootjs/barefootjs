/**
 * Text-slot HTML-escaping emit shape (#1694 + follow-up).
 *
 * Pins which interpolations the client template wraps in `escapeText`:
 *   - a plain text slot (`{stringValue}`) IS escaped — it becomes the
 *     slot's text content under `innerHTML`;
 *   - a branch-slot expression (Child-position value inside a conditional
 *     `template()` arrow) is routed through `__bfSlot` and must NOT be
 *     wrapped in `escapeText`. `__bfSlot` returns raw `<!--bf-slot:N-->`
 *     markers for live nodes; escaping the whole call corrupts them and
 *     drops slotted content (the regression that broke `e2e-site-ui`).
 *     `__bfSlot` escapes its own plain-string path internally instead.
 */

import { describe, test, expect } from 'bun:test'
import { compileJSX } from '../compiler'
import { TestAdapter } from '../adapters/test-adapter'

const adapter = new TestAdapter()

function getClientJs(source: string, filename: string): string {
  const result = compileJSX(source, filename, { adapter })
  expect(result.errors.filter(e => e.severity === 'error')).toHaveLength(0)
  const clientJs = result.files.find(f => f.type === 'clientJs')
  expect(clientJs).toBeDefined()
  return clientJs!.content
}

describe('text-slot escaping', () => {
  test('a plain text slot is wrapped in escapeText', () => {
    const clientJs = getClientJs(
      `'use client'
       export function Label({ text }: { text: string }) {
         return <span>{text}</span>
       }`,
      'Label.tsx',
    )
    expect(clientJs).toMatch(/<!--bf:\w+-->\$\{escapeText\(_p\.text\)\}<!--\/-->/)
  })

  test('a branch-slot expression is NOT wrapped in escapeText', () => {
    const clientJs = getClientJs(
      `'use client'
       import { createSignal } from '@barefootjs/client'
       export function Branch({ show }: { show: boolean }) {
         const [t] = createSignal('hi')
         return <div>{show ? <span>{t()}</span> : null}</div>
       }`,
      'Branch.tsx',
    )
    // The branch value goes through __bfSlot (raw markers preserved)…
    expect(clientJs).toMatch(/\$\{__bfSlot\(/)
    // …and must never be double-wrapped by the text escape.
    expect(clientJs).not.toMatch(/escapeText\(\s*__bfSlot/)
  })
})
