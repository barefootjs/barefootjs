// bf debug events <component> — Show event handlers and their reactive update paths.
//
// Lists every event handler (DOM and component prop), the setters each
// handler calls, and the downstream signal/memo/DOM updates that result.

import { readFileSync } from 'fs'
import type { CliContext } from '../context'
import { resolveComponentSource } from '../lib/resolve-source'

export async function run(args: string[], ctx: CliContext): Promise<void> {
  const componentName = args[0]

  if (!componentName) {
    console.error('Error: Component name required.')
    console.error('Usage: bf debug events <component> [--json]')
    process.exit(1)
  }

  const { buildEventSummary, formatEventSummary, buildComponentGraph } = await import('@barefootjs/jsx')

  const searched: string[] = []
  const resolved = resolveComponentSource(componentName, ctx, searched)
  if (!resolved) {
    console.error(`Error: Cannot find component "${componentName}".`)
    console.error('Looked in:')
    for (const p of searched) console.error(`  - ${p}`)
    process.exit(1)
  }

  const source = readFileSync(resolved.filePath, 'utf-8')
  const summary = buildEventSummary(source, resolved.filePath, resolved.componentName)

  if (ctx.jsonFlag) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  const graph = buildComponentGraph(source, resolved.filePath, resolved.componentName)
  console.log(formatEventSummary(summary, graph))
}
