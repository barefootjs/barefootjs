// bf search — find components and documentation by name, category, or tags.
// Default: searches both local meta/ and the upstream registry, tagging
// each result with its source. --dir or --registry restrict to a single source.

import path from 'path'
import type { CliContext } from '../context'
import type { MetaIndex } from '../lib/types'
import { loadIndex, fetchIndex, tryFetchIndex } from '../lib/meta-loader'
import { scanCoreDocs, type CoreDocMeta } from '../lib/docs-loader'

const DEFAULT_REGISTRY_URL = 'https://ui.barefootjs.dev/r/'

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

export type ResultSource = 'local' | 'registry' | 'doc'

export interface SearchResult {
  name: string
  type: 'component' | 'doc'
  source: ResultSource
  category: string
  description: string
  stateful?: boolean
}

export function search(query: string, index: MetaIndex, source: ResultSource, coreDocs?: CoreDocMeta[]): SearchResult[] {
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
      source,
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
      source: 'doc' as const,
      category: d.category,
      description: d.description,
    }))

  return [...componentResults, ...docResults]
}

export function printSearchResults(results: SearchResult[], jsonFlag: boolean) {
  if (jsonFlag) {
    console.log(JSON.stringify(results, null, 2))
    return
  }

  if (results.length === 0) {
    console.log('No results found.')
    return
  }

  const nameWidth = Math.max(25, ...results.map(r => r.name.length + 2))
  const sourceWidth = 12
  const typeWidth = 12
  const catWidth = 16
  const header = `${'NAME'.padEnd(nameWidth)}${'SOURCE'.padEnd(sourceWidth)}${'TYPE'.padEnd(typeWidth)}${'CATEGORY'.padEnd(catWidth)}DESCRIPTION`
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const r of results) {
    const statefulMark = r.stateful ? ' *' : ''
    console.log(
      `${(r.name + statefulMark).padEnd(nameWidth)}${r.source.padEnd(sourceWidth)}${r.type.padEnd(typeWidth)}${r.category.padEnd(catWidth)}${r.description.slice(0, 40)}`
    )
  }

  const componentCount = results.filter(r => r.type === 'component').length
  const docCount = results.filter(r => r.type === 'doc').length
  const parts: string[] = []
  if (componentCount > 0) parts.push(`${componentCount} component(s)`)
  if (docCount > 0) parts.push(`${docCount} doc(s)`)
  console.log(`\n${parts.join(', ')} found. (* = stateful)`)
  console.log(`Use 'bf docs <name>' or 'bf add <name>' for details / install.`)
}

/**
 * Merge local and registry results, deduplicating by name.
 * Local wins over registry (component is already installed).
 */
export function mergeResults(local: SearchResult[], registry: SearchResult[]): SearchResult[] {
  const localNames = new Set(local.filter(r => r.type === 'component').map(r => r.name))
  const dedupedRegistry = registry.filter(r => !localNames.has(r.name))
  return [...local, ...dedupedRegistry]
}

export async function run(args: string[], ctx: CliContext): Promise<void> {
  // Parse --dir flag
  let metaDir = ctx.metaDir
  let dirFlagUsed = false
  const dirIdx = args.indexOf('--dir')
  if (dirIdx !== -1) {
    const dirValue = args[dirIdx + 1]
    if (!dirValue || dirValue.startsWith('-')) {
      console.error('Error: --dir requires a path argument.')
      process.exit(1)
    }
    metaDir = path.resolve(dirValue)
    dirFlagUsed = true
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

  if (dirFlagUsed && registryUrl) {
    console.error('Error: --dir and --registry cannot be used together.')
    process.exit(1)
  }

  // Load core docs (skip gracefully if not available)
  const docsDir = path.join(ctx.root, 'docs/core')
  const coreDocs = scanCoreDocs(docsDir)

  const query = args.join(' ')

  // Explicit --registry: search only that registry
  if (registryUrl) {
    const index = await fetchIndex(registryUrl)
    const results = query
      ? search(query, index, 'registry', coreDocs)
      : index.components.map(c => ({ name: c.name, type: 'component' as const, source: 'registry' as const, category: c.category, description: c.description, stateful: c.stateful }))
    printSearchResults(results, ctx.jsonFlag)
    return
  }

  // Explicit --dir: search only that directory
  if (dirFlagUsed) {
    const index = loadIndex(metaDir)
    const results = query
      ? search(query, index, 'local', coreDocs)
      : index.components.map(c => ({ name: c.name, type: 'component' as const, source: 'local' as const, category: c.category, description: c.description, stateful: c.stateful }))
    printSearchResults(results, ctx.jsonFlag)
    return
  }

  // Default: search both local + upstream registry
  const localIndex = loadIndex(metaDir)
  const localResults = query
    ? search(query, localIndex, 'local', coreDocs)
    : [
        ...localIndex.components.map(c => ({ name: c.name, type: 'component' as const, source: 'local' as const, category: c.category, description: c.description, stateful: c.stateful })),
        ...coreDocs.map(d => ({ name: d.slug, type: 'doc' as const, source: 'doc' as const, category: d.category, description: d.description })),
      ]

  // Skip upstream fetch when inside the monorepo (local IS the registry source)
  const isMonorepo = ctx.projectDir === null
  let registryResults: SearchResult[] = []
  if (!isMonorepo) {
    const upstreamIndex = await tryFetchIndex(DEFAULT_REGISTRY_URL)
    if (upstreamIndex) {
      registryResults = query
        ? search(query, upstreamIndex, 'registry')
        : upstreamIndex.components.map(c => ({ name: c.name, type: 'component' as const, source: 'registry' as const, category: c.category, description: c.description, stateful: c.stateful }))
    }
  }

  const merged = mergeResults(localResults, registryResults)
  printSearchResults(merged, ctx.jsonFlag)
}
