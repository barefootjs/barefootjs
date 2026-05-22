import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateSharedComponentSnapshot } from '../snapshot-generator'
import { SNAPSHOT_DIR, loadAllSharedSpecs, type SharedFixtureSpec } from '../../fixtures/_helpers'

/**
 * Guards against #1494: snapshot fixtures churning on `Math.random()` scope
 * IDs from `HonoAdapter`. The snapshot generator seeds `Math.random` per
 * fixture so back-to-back regenerations produce byte-identical output.
 *
 * Pick a fixture whose rendered tree contains a `'use client'` loop child
 * (the path that hits the `Math.random()` fallback) — `todo-app-ssr` and
 * `toggle-shared` are the two known cases as of this writing.
 */
const SAMPLE_IDS = ['todo-app-ssr', 'toggle-shared'] as const

async function regenerate(spec: SharedFixtureSpec): Promise<{ html: string; clientJs: string }> {
  await generateSharedComponentSnapshot(spec)
  const html = readFileSync(resolve(SNAPSHOT_DIR, `${spec.id}.html`), 'utf8')
  const clientJs = readFileSync(resolve(SNAPSHOT_DIR, `${spec.id}.client.js`), 'utf8')
  return { html, clientJs }
}

describe('snapshot generator — Math.random determinism (#1494)', () => {
  // Each regen compiles JSX, writes a temp file and dynamically imports it,
  // so two passes over two fixtures comfortably exceeds the 5 s Bun default.
  test('back-to-back regens of the same fixture produce byte-identical files', async () => {
    const allSpecs = await loadAllSharedSpecs()
    const specs = SAMPLE_IDS.map(id => {
      const s = allSpecs.find(x => x.id === id)
      if (!s) throw new Error(`Sample fixture not found: ${id}`)
      return s
    })

    for (const spec of specs) {
      const first = await regenerate(spec)
      const second = await regenerate(spec)
      expect(second.html).toBe(first.html)
      expect(second.clientJs).toBe(first.clientJs)
    }
  }, 30_000)
})
