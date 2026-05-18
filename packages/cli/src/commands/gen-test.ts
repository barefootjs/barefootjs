// bf gen test — generate IR test from existing component source.

import { existsSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'
import { generateTestTemplate } from '../lib/test-template'

export function run(args: string[], ctx: CliContext): void {
  const componentName = args[0]
  if (!componentName) {
    console.error('Error: Component name required. Usage: bf gen test <component>')
    process.exit(1)
  }

  const standardPath = path.join(ctx.root, 'ui/components/ui', componentName, 'index.tsx')
  if (!existsSync(standardPath)) {
    console.error(`Error: Source file not found: ui/components/ui/${componentName}/index.tsx`)
    process.exit(1)
  }
  console.log(generateTestTemplate(standardPath))
}
