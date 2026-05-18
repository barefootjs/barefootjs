// bf gen preview — generate preview file from component metadata.

import { existsSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'
import { loadComponent } from '../lib/meta-loader'
import { generatePreview } from '../lib/preview-generate'

export async function run(args: string[], ctx: CliContext): Promise<void> {
  const force = args.includes('--force')
  const name = args.find(a => !a.startsWith('--'))

  if (!name) {
    console.error('Usage: bf gen preview <component> [--force]')
    process.exit(1)
  }

  const meta = loadComponent(ctx.metaDir, name)
  const result = generatePreview(meta)
  const absPath = path.join(ctx.root, result.filePath)

  if (existsSync(absPath) && !force) {
    console.error(`Error: ${result.filePath} already exists. Use --force to overwrite.`)
    process.exit(1)
  }

  const dir = path.dirname(absPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  writeFileSync(absPath, result.code)
  console.log(`Generated ${result.filePath}`)
  console.log(`Previews: ${result.previewNames.join(', ')}`)
}
