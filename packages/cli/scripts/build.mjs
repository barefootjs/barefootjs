#!/usr/bin/env node
// Bundle the CLI into a single file for npm distribution.
//
// - Entry: src/index.ts
// - Output: dist/index.js (ESM, single file)
// - Externals: typescript (needed at runtime by bundled jsx compiler),
//   esbuild (used by runtime.ts for transpile).
// - Everything else — including workspace packages like @barefootjs/jsx —
//   is bundled inline so the published CLI is self-contained.

import { build } from 'esbuild'
import { chmodSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pkgDir = resolve(here, '..')
const entry = resolve(pkgDir, 'src/index.ts')
const outfile = resolve(pkgDir, 'dist/index.js')

await build({
  entryPoints: [entry],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Keep runtime deps external so they are resolved from node_modules, not inlined.
  external: ['typescript', 'esbuild'],
  // Source index.ts carries the shebang; esbuild preserves it. No banner needed.
  legalComments: 'none',
  logLevel: 'info',
})

// Make the bundle executable so `bin` symlinks work.
chmodSync(outfile, 0o755)

console.log(`Built: ${outfile}`)
