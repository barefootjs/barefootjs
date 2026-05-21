import { describe, test, expect } from 'bun:test'
import {
  emptyLedger,
  EMIT_LEDGER_FILENAME,
  EMIT_LEDGER_VERSION,
  extractLedgerFromCache,
  loadEmitLedger,
  saveEmitLedger,
} from '../lib/emit-ledger'
import { emptyCache } from '../lib/build-cache'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

describe('loadEmitLedger / saveEmitLedger', () => {
  test('round-trips through disk', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bf-ledger-'))
    try {
      const ledger = emptyLedger()
      ledger.entries['/abs/Counter.tsx'] = [
        'components/Counter.client.js',
        'components/Counter.tsx',
      ]
      ledger.entries['bundle:/abs/app.ts'] = ['components/app.js']
      await saveEmitLedger(dir, ledger)
      const loaded = await loadEmitLedger(dir)
      expect(loaded).not.toBeNull()
      expect(loaded!.version).toBe(EMIT_LEDGER_VERSION)
      expect(loaded!.entries['/abs/Counter.tsx']).toEqual([
        'components/Counter.client.js',
        'components/Counter.tsx',
      ])
      expect(loaded!.entries['bundle:/abs/app.ts']).toEqual(['components/app.js'])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('returns null when ledger file is absent', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bf-ledger-'))
    try {
      expect(await loadEmitLedger(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('returns null when ledger file is malformed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bf-ledger-'))
    try {
      await Bun.write(join(dir, EMIT_LEDGER_FILENAME), '{ not valid json')
      expect(await loadEmitLedger(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  // Older ledger shapes must be treated as absent so a build with a stale
  // shape on disk does not crash on missing fields or feed half-parsed
  // garbage into the cleanup pass. The next build will rewrite the file
  // in the new shape.
  test('returns null when version is mismatched', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bf-ledger-'))
    try {
      await Bun.write(
        join(dir, EMIT_LEDGER_FILENAME),
        JSON.stringify({ version: 999, entries: {} }),
      )
      expect(await loadEmitLedger(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('returns null when entries field is missing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bf-ledger-'))
    try {
      await Bun.write(
        join(dir, EMIT_LEDGER_FILENAME),
        JSON.stringify({ version: EMIT_LEDGER_VERSION }),
      )
      expect(await loadEmitLedger(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  // Per-entry shape gate. The cleanup pass does `for (const output of
  // previousOutputs)` and passes each `output` to `unlink`, so a
  // non-iterable / non-string slipped past validation would either crash
  // mid-cleanup or call `unlink` on garbage. Reject the whole file
  // instead — the next build rewrites a clean ledger.
  test('returns null when an entry value is not a string array', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bf-ledger-'))
    try {
      await Bun.write(
        join(dir, EMIT_LEDGER_FILENAME),
        JSON.stringify({
          version: EMIT_LEDGER_VERSION,
          entries: { '/abs/X.tsx': 'not-an-array' },
        }),
      )
      expect(await loadEmitLedger(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('returns null when an entry value is an array containing non-strings', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bf-ledger-'))
    try {
      await Bun.write(
        join(dir, EMIT_LEDGER_FILENAME),
        JSON.stringify({
          version: EMIT_LEDGER_VERSION,
          entries: { '/abs/X.tsx': ['components/X.tsx', 123, null] },
        }),
      )
      expect(await loadEmitLedger(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

// Bootstrap path used on the first build after upgrade: the user has a
// `.buildcache.json` from a previous CLI version but no `.bfemit.json` yet,
// so we project the cache's `entries[*].outputs` into ledger shape to keep
// pre-existing orphans pruneable.
describe('extractLedgerFromCache', () => {
  test('projects cache entries with outputs into ledger shape', () => {
    const cache = emptyCache('gh')
    cache.entries['/abs/Counter.tsx'] = {
      hash: 'h',
      deps: {},
      outputs: ['components/Counter.client.js', 'components/Counter.tsx'],
      manifestKey: 'Counter',
    }
    cache.entries['bundle:/abs/app.ts'] = {
      hash: 'h',
      deps: {},
      outputs: ['components/app.js'],
      manifestKey: null,
    }
    const projected = extractLedgerFromCache(cache)
    expect(projected['/abs/Counter.tsx']).toEqual([
      'components/Counter.client.js',
      'components/Counter.tsx',
    ])
    expect(projected['bundle:/abs/app.ts']).toEqual(['components/app.js'])
  })

  test('skips entries with empty outputs', () => {
    const cache = emptyCache('gh')
    cache.entries['/abs/ServerOnly.tsx'] = {
      hash: 'h',
      deps: {},
      outputs: [],
      manifestKey: null,
    }
    expect(extractLedgerFromCache(cache)).toEqual({})
  })

  test('returns empty object for null cache', () => {
    expect(extractLedgerFromCache(null)).toEqual({})
  })

  // The cache file goes through `loadCache` which only validates the
  // top-level shape (`globalHash`, `entries`). A hand-edited or partially-
  // upgraded `.buildcache.json` could carry a string / number / nested
  // object in `outputs` and slip through; bootstrap must reject those
  // values rather than feed them to the cleanup pass. Skipping (not
  // throwing) keeps bootstrap best-effort by design.
  test('skips entries whose outputs are not a string array', () => {
    const cache = emptyCache('gh')
    // Hand-craft malformed shapes that would type-error in fresh code
    // but can land here from old or tampered on-disk cache files.
    cache.entries['/abs/Good.tsx'] = {
      hash: 'h',
      deps: {},
      outputs: ['components/Good.client.js'],
      manifestKey: null,
    }
    cache.entries['/abs/BadString.tsx'] = {
      hash: 'h',
      deps: {},
      outputs: 'components/Bad.client.js' as unknown as string[],
      manifestKey: null,
    }
    cache.entries['/abs/BadMixed.tsx'] = {
      hash: 'h',
      deps: {},
      outputs: ['components/X.tsx', 42 as unknown as string],
      manifestKey: null,
    }
    const projected = extractLedgerFromCache(cache)
    expect(projected['/abs/Good.tsx']).toEqual(['components/Good.client.js'])
    expect(projected['/abs/BadString.tsx']).toBeUndefined()
    expect(projected['/abs/BadMixed.tsx']).toBeUndefined()
  })
})
