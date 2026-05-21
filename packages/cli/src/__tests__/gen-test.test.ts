// Behaviour test for `bf gen test`: by default the command writes a
// `<Component>.test.tsx` file next to the resolved source, matching the
// "Next steps" `bf gen component` already prints. `--stdout` keeps the
// preview-only mode that callers can pipe somewhere; `--force` is
// required to overwrite an existing test file.

import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { run } from '../commands/gen-test'
import type { CliContext } from '../context'

let projectDir: string

beforeEach(() => { projectDir = mkdtempSync(path.join(tmpdir(), 'bf-gen-test-')) })
afterEach(() => { rmSync(projectDir, { recursive: true, force: true }) })

function ctxFor(): CliContext {
  return {
    root: projectDir,
    metaDir: path.join(projectDir, 'meta'),
    jsonFlag: false,
    projectDir,
    config: {
      paths: { components: 'components/ui', tokens: 'tokens', meta: 'meta' },
      sourceDirs: ['components'],
    },
  }
}

describe('bf gen test', () => {
  test('default: writes <Name>.test.tsx next to source for flat layout', () => {
    mkdirSync(path.join(projectDir, 'components'), { recursive: true })
    writeFileSync(
      path.join(projectDir, 'components/Counter.tsx'),
      `export function Counter() { return <div /> }`,
    )
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})
    try {
      run(['Counter'], ctxFor())
      const testPath = path.join(projectDir, 'components/Counter.test.tsx')
      expect(existsSync(testPath)).toBe(true)
      expect(readFileSync(testPath, 'utf-8')).toContain("describe('Counter'")
    } finally {
      logSpy.mockRestore()
    }
  })

  test('default: writes index.test.tsx next to a nested registry component', () => {
    mkdirSync(path.join(projectDir, 'components/ui/button'), { recursive: true })
    writeFileSync(
      path.join(projectDir, 'components/ui/button/index.tsx'),
      `function Button() { return <button /> }\nexport { Button }`,
    )
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})
    try {
      run(['button'], ctxFor())
      const testPath = path.join(projectDir, 'components/ui/button/index.test.tsx')
      expect(existsSync(testPath)).toBe(true)
      expect(readFileSync(testPath, 'utf-8')).toContain("describe('Button'")
    } finally {
      logSpy.mockRestore()
    }
  })

  test('--stdout: prints without touching the filesystem', () => {
    mkdirSync(path.join(projectDir, 'components'), { recursive: true })
    writeFileSync(
      path.join(projectDir, 'components/Counter.tsx'),
      `export function Counter() { return <div /> }`,
    )
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})
    try {
      run(['Counter', '--stdout'], ctxFor())
      expect(existsSync(path.join(projectDir, 'components/Counter.test.tsx'))).toBe(false)
      const printed = logSpy.mock.calls.map((c) => c[0]).join('\n')
      expect(printed).toContain("describe('Counter'")
    } finally {
      logSpy.mockRestore()
    }
  })

  test('refuses to overwrite an existing test without --force', () => {
    mkdirSync(path.join(projectDir, 'components'), { recursive: true })
    writeFileSync(
      path.join(projectDir, 'components/Counter.tsx'),
      `export function Counter() { return <div /> }`,
    )
    writeFileSync(path.join(projectDir, 'components/Counter.test.tsx'), 'PREEXISTING')

    const errSpy = spyOn(console, 'error').mockImplementation(() => {})
    const exitSpy = spyOn(process, 'exit').mockImplementation(((c?: number) => {
      throw new Error(`exit ${c ?? 0}`)
    }) as never)
    try {
      expect(() => run(['Counter'], ctxFor())).toThrow('exit 1')
      // Original content is intact.
      expect(readFileSync(path.join(projectDir, 'components/Counter.test.tsx'), 'utf-8'))
        .toBe('PREEXISTING')
      const joined = errSpy.mock.calls.map((c) => c[0]).join('\n')
      expect(joined).toContain('already exists')
      expect(joined).toContain('--force')
    } finally {
      errSpy.mockRestore()
      exitSpy.mockRestore()
    }
  })

  test('--force overwrites an existing test file', () => {
    mkdirSync(path.join(projectDir, 'components'), { recursive: true })
    writeFileSync(
      path.join(projectDir, 'components/Counter.tsx'),
      `export function Counter() { return <div /> }`,
    )
    writeFileSync(path.join(projectDir, 'components/Counter.test.tsx'), 'PREEXISTING')
    const logSpy = spyOn(console, 'log').mockImplementation(() => {})
    try {
      run(['Counter', '--force'], ctxFor())
      const content = readFileSync(path.join(projectDir, 'components/Counter.test.tsx'), 'utf-8')
      expect(content).not.toBe('PREEXISTING')
      expect(content).toContain("describe('Counter'")
    } finally {
      logSpy.mockRestore()
    }
  })

  // PM-aware import selection (issue #1454): the emitted test's
  // `import { describe, ... } from '<runner>'` line follows the
  // detected PM. Bun ships an in-runtime runner (`bun:test`); every
  // other PM gets `vitest` paired with the `vitest run` script that
  // `bf init` wires up. The lockfile is the strongest detection
  // signal, so each case below pins one to fix the runner choice.
  describe('PM-aware test-runner import (issue #1454)', () => {
    function setup(lockfile: string): void {
      writeFileSync(path.join(projectDir, lockfile), '')
      mkdirSync(path.join(projectDir, 'components'), { recursive: true })
      writeFileSync(
        path.join(projectDir, 'components/Counter.tsx'),
        `export function Counter() { return <div /> }`,
      )
    }

    test('bun.lock → emits `from \'bun:test\'`', () => {
      setup('bun.lock')
      const logSpy = spyOn(console, 'log').mockImplementation(() => {})
      try {
        run(['Counter'], ctxFor())
        const content = readFileSync(path.join(projectDir, 'components/Counter.test.tsx'), 'utf-8')
        expect(content).toContain(`from 'bun:test'`)
        expect(content).not.toContain(`from 'vitest'`)
      } finally {
        logSpy.mockRestore()
      }
    })

    test.each([
      ['package-lock.json', 'npm'],
      ['pnpm-lock.yaml', 'pnpm'],
      ['yarn.lock', 'yarn'],
    ])('%s (%s) → emits `from \'vitest\'`', (lockfile) => {
      setup(lockfile)
      const logSpy = spyOn(console, 'log').mockImplementation(() => {})
      try {
        run(['Counter'], ctxFor())
        const content = readFileSync(path.join(projectDir, 'components/Counter.test.tsx'), 'utf-8')
        expect(content).toContain(`from 'vitest'`)
        expect(content).not.toContain(`from 'bun:test'`)
      } finally {
        logSpy.mockRestore()
      }
    })
  })
})
