// Guard against `ui/meta/*.json` drifting away from `ui/components/ui/`.
//
// `bf add` in monorepo mode now reads sibling imports from source, so a
// stale meta file no longer breaks `bf add` (the regression in #1435).
// But meta still backs `bf docs`, `bf search`, `bf debug graph`,
// `llms.txt`, and the public registry feed — when those go stale,
// agents and humans see lies about the component surface.
//
// This test re-runs `extractMetaForFile` over every component and fails
// if the result differs from what's checked in. The fix is always:
//   bun run meta:extract
//
// We intentionally compare the full JSON so even subtle additions
// (props, signals, sub-components) get caught — that's the kind of
// drift that silently rotted `ui/meta/checkbox.json` for issue #1435.

import { describe, test, expect } from 'bun:test'
import { existsSync, readFileSync, readdirSync } from 'fs'
import path from 'path'
import { extractMetaForFile } from '../commands/meta-extract'
import type { ComponentMeta } from '../lib/types'

const repoRoot = path.resolve(import.meta.dir, '../../../..')
const srcComponentsDir = path.join(repoRoot, 'ui/components/ui')
const metaDir = path.join(repoRoot, 'ui/meta')

function loadRegistry(): Record<string, { title: string; description: string }> {
  const registryPath = path.join(repoRoot, 'ui/registry.json')
  const registry: Record<string, { title: string; description: string }> = {}
  try {
    const data = JSON.parse(readFileSync(registryPath, 'utf-8'))
    for (const item of data.items || []) {
      registry[item.name] = { title: item.title, description: item.description }
    }
  } catch {
    // optional
  }
  return registry
}

function listComponents(): string[] {
  return readdirSync(srcComponentsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => existsSync(path.join(srcComponentsDir, name, 'index.tsx')))
    .sort()
}

const components = listComponents()
const registry = loadRegistry()

describe('ui/meta/*.json drift guard', () => {
  test('every component under ui/components/ui/ has a checked-in meta file', () => {
    const missing: string[] = []
    for (const name of components) {
      if (!existsSync(path.join(metaDir, `${name}.json`))) missing.push(name)
    }
    expect(missing, `Missing ui/meta/<name>.json — run \`bun run meta:extract\` and commit the result.`).toEqual([])
  })

  for (const name of components) {
    // Big multi-component files (calendar, chart, data-table) push the
    // analyzer past Bun's 5s default — give them headroom.
    test(`ui/meta/${name}.json matches extractor output`, () => {
      const metaPath = path.join(metaDir, `${name}.json`)
      if (!existsSync(metaPath)) {
        // Reported by the "every component has a meta file" test above.
        return
      }

      const indexPath = path.join(srcComponentsDir, name, 'index.tsx')
      const { meta: fresh } = extractMetaForFile(indexPath, repoRoot, registry)
      const checkedIn: ComponentMeta = JSON.parse(readFileSync(metaPath, 'utf-8'))

      expect(
        fresh,
        `ui/meta/${name}.json is stale — run \`bun run meta:extract\` and commit the result.`,
      ).toEqual(checkedIn)
    }, 30_000)
  }
})
