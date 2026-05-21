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
})
