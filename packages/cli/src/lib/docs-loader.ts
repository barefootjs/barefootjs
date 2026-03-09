// Load and resolve core documentation from docs/core/.

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import path from 'path'

export interface CoreDocMeta {
  slug: string         // e.g., "reactivity/create-signal"
  title: string
  description: string
  category: string     // subdirectory name: "reactivity", "core-concepts", etc.
  filePath: string     // absolute path
}

/**
 * Parse YAML frontmatter from markdown content.
 * Handles both YAML frontmatter and bare `# Heading` formats.
 */
export function parseFrontmatter(content: string): {
  title: string
  description: string
  body: string
} {
  if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
    const endIdx = content.indexOf('\n---', 3)
    if (endIdx !== -1) {
      const yaml = content.slice(4, endIdx)
      const body = content.slice(endIdx + 4).replace(/^\r?\n/, '')

      let title = ''
      let description = ''
      for (const line of yaml.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('title:')) {
          title = trimmed.slice(6).trim().replace(/^['"]|['"]$/g, '')
        } else if (trimmed.startsWith('description:')) {
          description = trimmed.slice(12).trim().replace(/^['"]|['"]$/g, '')
        }
      }
      return { title, description, body }
    }
  }

  // No frontmatter: extract title from first # heading
  const lines = content.split('\n')
  const headingLine = lines.find(l => l.startsWith('# '))
  const title = headingLine ? headingLine.slice(2).trim() : ''
  return { title, description: '', body: content }
}

/**
 * Scan docs/core/ recursively and return metadata for all .md files.
 * Excludes README.md.
 */
export function scanCoreDocs(docsDir: string): CoreDocMeta[] {
  if (!existsSync(docsDir)) return []

  const results: CoreDocMeta[] = []

  function scan(dir: string) {
    for (const entry of readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        scan(fullPath)
      } else if (entry.endsWith('.md') && entry !== 'README.md') {
        const relativePath = path.relative(docsDir, fullPath)
        const slug = relativePath.replace(/\.md$/, '')
        const parts = slug.split(path.sep)
        const category = parts.length > 1 ? parts[0] : 'overview'
        const content = readFileSync(fullPath, 'utf-8')
        const { title, description } = parseFrontmatter(content)
        results.push({ slug, title, description, category, filePath: fullPath })
      }
    }
  }

  scan(docsDir)
  return results.sort((a, b) => a.slug.localeCompare(b.slug))
}

/**
 * Resolve a document by name.
 * 1. Exact slug match (e.g., "reactivity/create-signal")
 * 2. Filename match (e.g., "create-signal" finds "reactivity/create-signal")
 * 3. If multiple filename matches, returns null (caller should list candidates)
 */
export function resolveDoc(
  docsDir: string,
  name: string,
): { doc: CoreDocMeta | null; candidates: CoreDocMeta[] } {
  const docs = scanCoreDocs(docsDir)

  // Exact slug match
  const exact = docs.find(d => d.slug === name)
  if (exact) return { doc: exact, candidates: [] }

  // Filename match (last segment)
  const matches = docs.filter(d => {
    const filename = d.slug.split('/').pop()
    return filename === name
  })

  if (matches.length === 1) return { doc: matches[0], candidates: [] }
  if (matches.length > 1) return { doc: null, candidates: matches }

  return { doc: null, candidates: [] }
}
