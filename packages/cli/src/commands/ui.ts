// barefoot ui — show detailed component documentation.

import type { CliContext } from '../context'
import type { ComponentMeta } from '../lib/types'
import { loadComponent } from '../lib/meta-loader'

function printComponent(meta: ComponentMeta, jsonFlag: boolean) {
  if (jsonFlag) {
    console.log(JSON.stringify(meta, null, 2))
    return
  }

  console.log(`# ${meta.title}`)
  console.log(`Category: ${meta.category} | Stateful: ${meta.stateful ? 'yes' : 'no'}`)
  if (meta.tags.length > 0) console.log(`Tags: ${meta.tags.join(', ')}`)
  console.log()
  console.log(meta.description)
  console.log()

  // Props
  if (meta.props.length > 0) {
    console.log('## Props')
    for (const p of meta.props) {
      const req = p.required ? ' (required)' : ''
      const def = p.default ? ` [default: ${p.default}]` : ''
      console.log(`  ${p.name}${req}: ${p.type}${def}`)
      if (p.description) console.log(`    ${p.description}`)
    }
    console.log()
  }

  // Sub-components
  if (meta.subComponents && meta.subComponents.length > 0) {
    console.log('## Sub-Components')
    for (const sub of meta.subComponents) {
      console.log(`  ${sub.name}`)
      if (sub.description) console.log(`    ${sub.description}`)
      for (const p of sub.props) {
        const def = p.default ? ` [default: ${p.default}]` : ''
        console.log(`    - ${p.name}: ${p.type}${def}`)
      }
    }
    console.log()
  }

  // Variants
  if (meta.variants) {
    console.log('## Variants')
    for (const [name, values] of Object.entries(meta.variants)) {
      console.log(`  ${name}: ${values.join(' | ')}`)
    }
    console.log()
  }

  // Examples
  if (meta.examples.length > 0) {
    console.log('## Examples')
    for (const ex of meta.examples) {
      console.log(`  ### ${ex.title}`)
      console.log('  ```tsx')
      for (const line of ex.code.split('\n')) {
        console.log(`  ${line}`)
      }
      console.log('  ```')
    }
    console.log()
  }

  // Accessibility
  if (meta.accessibility.role || meta.accessibility.ariaAttributes.length > 0) {
    console.log('## Accessibility')
    if (meta.accessibility.role) console.log(`  Role: ${meta.accessibility.role}`)
    if (meta.accessibility.ariaAttributes.length > 0) console.log(`  ARIA: ${meta.accessibility.ariaAttributes.join(', ')}`)
    if (meta.accessibility.dataAttributes.length > 0) console.log(`  Data: ${meta.accessibility.dataAttributes.join(', ')}`)
    console.log()
  }

  // Related
  if (meta.related.length > 0) {
    console.log(`## Related: ${meta.related.join(', ')}`)
    console.log()
  }

  console.log(`Source: ${meta.source}`)
}

export function run(args: string[], ctx: CliContext): void {
  const query = args.join(' ')
  if (!query) {
    console.error('Error: Component name required. Usage: barefoot ui <component>')
    process.exit(1)
  }
  printComponent(loadComponent(ctx.metaDir, query), ctx.jsonFlag)
}
