// barefoot search — find components and documentation by name, category, or tags.

import path from 'path'
import type { CliContext } from '../context'
import type { MetaIndex } from '../lib/types'
import { loadIndex, fetchIndex } from '../lib/meta-loader'
import { scanCoreDocs, type CoreDocMeta } from '../lib/docs-loader'

// Category aliases for better search (e.g., "form" → "input" components)
const categoryAliases: Record<string, string[]> = {
  'form': ['input'],
  'modal': ['overlay'],
  'nav': ['navigation'],
  'menu': ['navigation', 'overlay'],
  'signal': ['reactivity'],
  'compiler': ['advanced'],
  'template': ['adapters'],
}

export interface SearchResult {
  name: string
  type: 'component' | 'doc'
  category: string
  description: string
  stateful?: boolean
}

export function search(query: string, index: MetaIndex, coreDocs?: CoreDocMeta[]): SearchResult[] {
  const q = query.toLowerCase()
  const aliasCategories = categoryAliases[q] || []

  const componentResults: SearchResult[] = index.components
    .filter(c =>
      c.name.includes(q) ||
      c.category.includes(q) ||
      aliasCategories.includes(c.category) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some(t => t.includes(q))
    )
    .map(c => ({
      name: c.name,
      type: 'component' as const,
      category: c.category,
      description: c.description,
      stateful: c.stateful,
    }))

  const docResults: SearchResult[] = (coreDocs ?? [])
    .filter(d =>
      d.slug.includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.category.includes(q) ||
      aliasCategories.includes(d.category) ||
      d.description.toLowerCase().includes(q)
    )
    .map(d => ({
      name: d.slug,
      type: 'doc' as const,
      category: d.category,
      description: d.description,
    }))

  return [...componentResults, ...docResults]
}

function printSearchResults(results: SearchResult[], jsonFlag: boolean) {
  if (jsonFlag) {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  if (results.length === 0) {
    console.log('No results found.')
    return
  }

  // Table format
  const nameWidth = Math.max(25, ...results.map(r => r.name.length + 2))
  const typeWidth = 12
  const catWidth = 16
  const header = `${'NAME'.padEnd(nameWidth)}${'TYPE'.padEnd(typeWidth)}${'CATEGORY'.padEnd(catWidth)}DESCRIPTION`
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const r of results) {
    const statefulMark = r.stateful ? ' *' : ''
    console.log(`${(r.name + statefulMark).padEnd(nameWidth)}${r.type.padEnd(typeWidth)}${r.category.padEnd(catWidth)}${r.description.slice(0, 50)}`)
  }

  const componentCount = results.filter(r => r.type === 'component').length
  const docCount = results.filter(r => r.type === 'doc').length
  const parts: string[] = []
  if (componentCount > 0) parts.push(`${componentCount} component(s)`)
  if (docCount > 0) parts.push(`${docCount} doc(s)`)
  console.log(`\n${parts.join(', ')} found. (* = stateful)`)
  console.log(`Use 'barefoot ui <name>' or 'barefoot core <name>' for details.`)
}

export async function run(args: string[], ctx: CliContext): Promise<void> {
  // Parse --dir flag
  let metaDir = ctx.metaDir
  const dirIdx = args.indexOf('--dir')
  if (dirIdx !== -1) {
    const dirValue = args[dirIdx + 1]
    if (!dirValue || dirValue.startsWith('-')) {
      console.error('Error: --dir requires a path argument.')
      process.exit(1)
    }
    metaDir = path.resolve(dirValue)
    args = [...args.slice(0, dirIdx), ...args.slice(dirIdx + 2)]
  }

  // Parse --registry flag
  let registryUrl: string | undefined
  const regIdx = args.indexOf('--registry')
  if (regIdx !== -1) {
    const regValue = args[regIdx + 1]
    if (!regValue || regValue.startsWith('-')) {
      console.error('Error: --registry requires a URL argument.')
      process.exit(1)
    }
    registryUrl = regValue
    args = [...args.slice(0, regIdx), ...args.slice(regIdx + 2)]
  }

  // Mutual exclusion
  if (dirIdx !== -1 && registryUrl) {
    console.error('Error: --dir and --registry cannot be used together.')
    process.exit(1)
  }

  // Load component index from local or remote source
  const index = registryUrl
    ? await fetchIndex(registryUrl)
    : loadIndex(metaDir)

  // Load core docs (skip gracefully if not available)
  const docsDir = path.join(ctx.root, 'docs/core')
  const coreDocs = scanCoreDocs(docsDir)

  const query = args.join(' ')
  if (!query) {
    // No query: list all
    const allResults: SearchResult[] = [
      ...index.components.map(c => ({
        name: c.name,
        type: 'component' as const,
        category: c.category,
        description: c.description,
        stateful: c.stateful,
      })),
      ...coreDocs.map(d => ({
        name: d.slug,
        type: 'doc' as const,
        category: d.category,
        description: d.description,
      })),
    ]
    printSearchResults(allResults, ctx.jsonFlag)
  } else {
    printSearchResults(search(query, index, coreDocs), ctx.jsonFlag)
  }
}
