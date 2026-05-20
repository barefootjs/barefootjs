// Unit tests for `tryLoadComponent` + `formatMissingComponentError`.
//
// The interesting branch — and the one #1403 fixes — is the error
// formatter detecting when a missing-meta lookup is actually a
// top-level page component living under `sourceDirs`, rather than a
// registry component the user forgot to `bf add`. Without the
// detection, every miss prints "run `bf meta extract`", which is a
// dead end for top-level sources.

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import type { CliContext } from '../context'
import { formatMissingComponentError, tryLoadComponent } from '../lib/meta-loader'

let projectDir: string

beforeEach(() => { projectDir = mkdtempSync(path.join(tmpdir(), 'bf-meta-loader-')) })
afterEach(() => { rmSync(projectDir, { recursive: true, force: true }) })

function ctxFor(opts: { paths?: string; sourceDirs?: string[] } = {}): CliContext {
  return {
    root: projectDir,
    metaDir: path.join(projectDir, 'meta'),
    jsonFlag: false,
    projectDir,
    config: {
      paths: {
        components: opts.paths ?? 'components/ui',
        tokens: 'tokens',
        meta: 'meta',
      },
      sourceDirs: opts.sourceDirs ?? ['components'],
    },
  }
}

describe('tryLoadComponent', () => {
  test('returns null when the JSON file is absent', () => {
    expect(tryLoadComponent(path.join(projectDir, 'meta'), 'NoSuch')).toBeNull()
  })

  test('returns parsed meta when the JSON file is present', () => {
    const metaDir = path.join(projectDir, 'meta')
    mkdirSync(metaDir, { recursive: true })
    writeFileSync(
      path.join(metaDir, 'Button.json'),
      JSON.stringify({ name: 'Button', title: 'Button', category: 'input' }),
    )
    const meta = tryLoadComponent(metaDir, 'Button')
    expect(meta).not.toBeNull()
    expect(meta!.name).toBe('Button')
  })

  test('case-insensitive fallback: `bf docs Button` finds registry meta button.json', () => {
    // `bf add` writes registry meta with the registry-canonical
    // (lowercase) name. Users naturally try PascalCase first; the
    // case-insensitive fallback rescues that case without affecting
    // exact-case behavior.
    const metaDir = path.join(projectDir, 'meta')
    mkdirSync(metaDir, { recursive: true })
    writeFileSync(
      path.join(metaDir, 'button.json'),
      JSON.stringify({ name: 'button', title: 'Button', category: 'input' }),
    )
    const meta = tryLoadComponent(metaDir, 'Button')
    expect(meta).not.toBeNull()
    expect(meta!.title).toBe('Button')
  })

  test('exact-case match wins when both casings exist on disk', () => {
    const metaDir = path.join(projectDir, 'meta')
    mkdirSync(metaDir, { recursive: true })
    writeFileSync(path.join(metaDir, 'Button.json'), JSON.stringify({ name: 'Pascal' }))
    writeFileSync(path.join(metaDir, 'button.json'), JSON.stringify({ name: 'lower' }))
    expect(tryLoadComponent(metaDir, 'Button')!.name).toBe('Pascal')
    expect(tryLoadComponent(metaDir, 'button')!.name).toBe('lower')
  })

  test('ambiguous case-insensitive match → returns null (no readdir-order roulette)', () => {
    // Both casings on disk; a mixed-case query (`BuTtOn`) matches both
    // under case-insensitive comparison and neither exact-case. Picking
    // either one would depend on `readdirSync` ordering, so the fallback
    // bails to null and the caller falls through to the "not found" hint.
    const metaDir = path.join(projectDir, 'meta')
    mkdirSync(metaDir, { recursive: true })
    writeFileSync(path.join(metaDir, 'Button.json'), JSON.stringify({ name: 'Pascal' }))
    writeFileSync(path.join(metaDir, 'button.json'), JSON.stringify({ name: 'lower' }))
    expect(tryLoadComponent(metaDir, 'BuTtOn')).toBeNull()
  })
})

describe('formatMissingComponentError', () => {
  test('without ctx → falls back to the legacy meta-extract hint', () => {
    const lines = formatMissingComponentError(
      path.join(projectDir, 'meta'),
      'Button',
    )
    const joined = lines.join('\n')
    expect(joined).toContain('Error: Component "Button" not found')
    expect(joined).toContain('bf meta extract')
    expect(joined).not.toContain('bf debug graph')
  })

  test('with ctx but no source on disk → still the legacy hint', () => {
    const lines = formatMissingComponentError(
      path.join(projectDir, 'meta'),
      'Phantom',
      ctxFor(),
    )
    const joined = lines.join('\n')
    expect(joined).toContain('bf meta extract')
    expect(joined).not.toContain('bf debug graph')
  })

  test('with ctx + top-level page source on disk → redirects at bf debug graph', () => {
    mkdirSync(path.join(projectDir, 'components'), { recursive: true })
    writeFileSync(
      path.join(projectDir, 'components/Counter.tsx'),
      `export function Counter() { return <div /> }`,
    )

    const lines = formatMissingComponentError(
      path.join(projectDir, 'meta'),
      'Counter',
      ctxFor(),
    )
    const joined = lines.join('\n')
    expect(joined).toContain('top-level page component')
    expect(joined).toContain('components/Counter.tsx')
    expect(joined).toContain('bf debug graph Counter')
    expect(joined).toContain('bf gen test Counter')
    // The misleading "run `bf meta extract`" hint stays out — that's
    // the entire point of this branch.
    expect(joined).not.toContain('bf meta extract')
  })

  test('with ctx + source under `paths.components` → legacy hint (registry miss)', () => {
    // A source that lives under the UI registry path is a real
    // "registry component that hasn't been meta-extracted yet" — the
    // user needs `bf meta extract`, not a redirect.
    mkdirSync(path.join(projectDir, 'components/ui/widget'), { recursive: true })
    writeFileSync(
      path.join(projectDir, 'components/ui/widget/index.tsx'),
      `function Widget() { return <div /> }\nexport { Widget }`,
    )

    const lines = formatMissingComponentError(
      path.join(projectDir, 'meta'),
      'widget',
      ctxFor(),
    )
    const joined = lines.join('\n')
    expect(joined).toContain('bf meta extract')
    expect(joined).not.toContain('top-level page component')
  })
})
