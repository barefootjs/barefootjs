// bf preview — compile a component's previews to a CSR bundle.
//
// Preview compilation currently relies on the monorepo layout (the UI
// component registry, design tokens, and UnoCSS config under `site/`),
// so it runs only from inside the barefootjs monorepo checkout. Making
// it work against an arbitrary user project is tracked in
// https://github.com/piconic-ai/barefootjs/issues/885.

import { existsSync, readdirSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'
import { resolveScaffoldLayout } from '../lib/scaffold-layout'
import { runPreview } from '../lib/preview/run'

function listPreviewableComponents(ctx: CliContext): string[] {
  // Mirror `bf gen preview`'s write location so the lister and the
  // generator agree on where previews live.
  const { writeRoot, componentsBasePath } = resolveScaffoldLayout(ctx)
  const componentsDir = path.join(writeRoot, componentsBasePath)
  if (!existsSync(componentsDir)) return []
  const names: string[] = []
  for (const name of readdirSync(componentsDir)) {
    const previewFile = path.join(componentsDir, name, 'index.preview.tsx')
    if (existsSync(previewFile)) names.push(name)
  }
  return names.sort()
}

export async function run(args: string[], ctx: CliContext): Promise<void> {
  const component = args[0]
  if (!component) {
    const available = listPreviewableComponents(ctx)
    if (ctx.jsonFlag) {
      console.log(JSON.stringify({ previewable: available }, null, 2))
      return
    }
    if (available.length === 0) {
      console.error('No previewable components found.')
      console.error('Generate one with: bf gen preview <component>')
      process.exit(1)
    }
    console.log(`${available.length} previewable component(s):`)
    for (const name of available) console.log(`  ${name}`)
    console.log()
    console.log('Open one with: bf preview <component>')
    return
  }

  // Preview compilation needs the monorepo's UI registry + design tokens.
  if (ctx.config !== null) {
    console.error('bf preview currently runs only inside the barefootjs monorepo.')
    console.error('Tracking issue: https://github.com/piconic-ai/barefootjs/issues/885')
    process.exit(1)
  }

  await runPreview(component, {
    rootDir: ctx.root,
    uiDir: path.join(ctx.root, 'ui/components/ui'),
    metaDir: ctx.metaDir,
  })
}
