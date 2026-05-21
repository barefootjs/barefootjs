// Durable record of "what did the last build emit?", kept independent of the
// per-entry build cache so orphan-output cleanup keeps working when the cache
// is wiped — e.g. `bf build --force`, or any globalHash change from a
// `bun install` / `barefoot.config.ts` edit.
//
// Background (piconic-ai/barefootjs#1455): the existing cleanup pass in
// `build.ts` discovers orphaned output files by walking `cache.entries`. When
// the cache is dropped, `cache.entries` is empty and the pass deletes nothing,
// so previously-emitted client JS / templates for sources that have since
// been deleted (or renamed, or had their output layout changed) survive the
// rebuild and accumulate in `outDir`.
//
// The ledger stores `{ sourceKey → emitted output paths (relative to outDir) }`
// in `.bfemit.json` next to `.buildcache.json`. The two files share a key
// space (entry path for components, `bundle:<abs>` for bundle entries) but
// have separate lifecycles: the cache invalidates when compilation inputs
// change, the ledger only changes when outputs change.

import { resolve } from 'node:path'
import { fileExists, readText, writeText } from './runtime'
import type { BuildCache } from './build-cache'

export const EMIT_LEDGER_FILENAME = '.bfemit.json'

/**
 * Bump when the on-disk shape changes incompatibly. Older versions are
 * treated as absent so a build proceeds without trying to read a stale
 * shape — the new shape is rewritten at the end of the build.
 */
export const EMIT_LEDGER_VERSION = 1

export interface EmitLedger {
  version: number
  /**
   * Outputs the previous build emitted, keyed by stable source identifier.
   *   - Component entries: absolute path of the source `.tsx` file.
   *   - Bundle entries: `bundle:<abs-entry-path>`.
   * Values are output paths relative to `outDir`.
   */
  entries: Record<string, string[]>
}

export function emptyLedger(): EmitLedger {
  return { version: EMIT_LEDGER_VERSION, entries: {} }
}

export async function loadEmitLedger(outDir: string): Promise<EmitLedger | null> {
  const path = resolve(outDir, EMIT_LEDGER_FILENAME)
  if (!(await fileExists(path))) return null
  try {
    const parsed = JSON.parse(await readText(path)) as EmitLedger
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.version !== EMIT_LEDGER_VERSION ||
      typeof parsed.entries !== 'object' ||
      parsed.entries === null
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export async function saveEmitLedger(outDir: string, ledger: EmitLedger): Promise<void> {
  const path = resolve(outDir, EMIT_LEDGER_FILENAME)
  await writeText(path, JSON.stringify(ledger, null, 2))
}

/**
 * Project a `BuildCache.entries` map into the ledger's `entries` shape.
 *
 * Used as a one-shot migration on the first build after upgrading: a user
 * whose previous build wrote `.buildcache.json` but no `.bfemit.json` still
 * gets their pre-existing orphans pruned, instead of having to wait until
 * the cycle after this build to seed the ledger.
 */
export function extractLedgerFromCache(cache: BuildCache | null): Record<string, string[]> {
  if (!cache) return {}
  const out: Record<string, string[]> = {}
  for (const [key, entry] of Object.entries(cache.entries)) {
    if (entry.outputs && entry.outputs.length > 0) {
      out[key] = entry.outputs.slice()
    }
  }
  return out
}
