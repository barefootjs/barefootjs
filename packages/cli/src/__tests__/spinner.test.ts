// Contract test for the spinner helper. The real CLI runs the
// interactive (TTY) path, but most callers we care about (CI, scenario
// tests) hit the non-TTY degrade path, so we cover both.

import { describe, test, expect } from 'bun:test'
import { PassThrough } from 'node:stream'
import { startSpinner } from '../lib/spinner'

function collect(): {
  output: PassThrough & { isTTY: boolean }
  text: () => string
  stripAnsi: () => string
} {
  const out = Object.assign(new PassThrough(), { isTTY: false })
  const chunks: string[] = []
  out.on('data', (c) => chunks.push(c.toString()))
  return {
    output: out,
    text: () => chunks.join(''),
    // Strip CR (\r) and CSI sequences so non-spinner assertions don't
    // have to know about cursor-movement codes.
    stripAnsi: () => chunks.join('').replace(/\r/g, '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, ''),
  }
}

describe('startSpinner — non-TTY', () => {
  test('writes the start text on a single line, succeed adds ✔', () => {
    const { output, text } = collect()
    const s = startSpinner({ text: 'Creating files...', output })
    s.succeed()
    expect(text()).toBe('Creating files...\n✔ Creating files...\n')
  })

  test('succeed(message) overrides the final line text', () => {
    const { output, text } = collect()
    const s = startSpinner({ text: 'Creating files...', output })
    s.succeed('Created 13 files')
    expect(text()).toBe('Creating files...\n✔ Created 13 files\n')
  })

  test('fail prints ✖ with the current text', () => {
    const { output, text } = collect()
    const s = startSpinner({ text: 'Checking registry...', output })
    s.fail('Registry unreachable')
    expect(text()).toBe('Checking registry...\n✖ Registry unreachable\n')
  })

  test('stop ends silently', () => {
    const { output, text } = collect()
    const s = startSpinner({ text: 'Idle...', output })
    s.stop()
    expect(text()).toBe('Idle...\n')
  })
})

describe('startSpinner — TTY', () => {
  test('cycles braille frames between calls and clears the line on succeed', async () => {
    const out = Object.assign(new PassThrough(), { isTTY: true })
    const chunks: string[] = []
    out.on('data', (c) => chunks.push(c.toString()))
    const s = startSpinner({ text: 'Working...', output: out, interval: 10 })
    // Let the interval tick a couple of times.
    await new Promise((r) => setTimeout(r, 35))
    s.succeed('Done')
    const joined = chunks.join('')
    // At least one braille frame rendered…
    expect(joined).toMatch(/[⠇⠏⠙⠹⠸⠼⠴⠦⠧⠋]/)
    // …and the final state ends with the ✔ line.
    expect(joined).toMatch(/✔ Done\n$/)
  })
})
