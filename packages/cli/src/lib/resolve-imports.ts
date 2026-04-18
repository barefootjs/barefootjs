// Resolve and inline relative imports in compiled client JS files.

import { dirname, resolve } from 'node:path'
import { RELATIVE_IMPORT_RE } from './patterns'
import { fileExists, readText, transpile, writeText } from './runtime'

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface ResolveRelativeImportsOptions {
  /** Absolute path to the dist directory (base for manifest paths) */
  distDir: string
  /** Build manifest: componentName -> { clientJs?, markedTemplate } */
  manifest: Record<string, { clientJs?: string; markedTemplate: string }>
  /** Source directories to search for modules (checked after the client JS file's own directory) */
  sourceDirs?: string[]
}

/**
 * Resolve relative imports in compiled client JS files.
 *
 * For each client JS file in the manifest:
 * - `.ts` imports: transpile and inline the code
 * - `.tsx` imports: strip (server component, already rendered at SSR time)
 * - Not found / already inlined: strip
 */
export async function resolveRelativeImports(options: ResolveRelativeImportsOptions): Promise<void> {
  const { distDir, manifest, sourceDirs = [] } = options

  for (const [, entry] of Object.entries(manifest)) {
    if (!entry.clientJs) continue
    const filePath = resolve(distDir, entry.clientJs)
    let content: string
    try {
      content = await readText(filePath)
    } catch {
      continue
    }

    // Reset the global regex for each file
    const re = new RegExp(RELATIVE_IMPORT_RE.source, RELATIVE_IMPORT_RE.flags)
    const matches = [...content.matchAll(re)]
    if (matches.length === 0) continue

    const inlinedPaths = new Set<string>()

    for (const match of matches) {
      const importPath = match[1]
      const fullMatch = match[0]

      // Try to resolve source file: first relative to client JS, then sourceDirs
      const searchDirs = [dirname(filePath), ...sourceDirs]
      let sourceFile = ''
      for (const dir of searchDirs) {
        const basePath = resolve(dir, importPath)
        for (const ext of ['.ts', '.tsx', '.js']) {
          if (await fileExists(basePath + ext)) {
            sourceFile = basePath + ext
            break
          }
        }
        if (sourceFile) break
      }

      if (!sourceFile || inlinedPaths.has(sourceFile)) {
        // Already inlined or not found — strip the import
        content = content.replace(new RegExp(escapeRegExp(fullMatch) + '\\n?'), '')
        continue
      }

      // Only inline pure TS modules (no JSX). TSX files with JSX are server
      // components whose rendering was already done at SSR time — their imports
      // in client JS are for component name matching only, not runtime execution.
      if (sourceFile.endsWith('.tsx')) {
        content = content.replace(new RegExp(escapeRegExp(fullMatch) + '\\n?'), '')
        console.log(`Stripped server component import: ${importPath} from ${entry.clientJs}`)
        continue
      }

      // Transpile and inline pure TS utility modules
      const sourceContent = await readText(sourceFile)
      let jsCode = transpile(sourceContent, { loader: 'ts' })

      // Convert exports to plain declarations for inlining
      jsCode = jsCode
        .replace(/^import\s+.*$/gm, '')
        .replace(/^export\s+/gm, '')
        .trim()

      content = content.replace(fullMatch, jsCode)
      inlinedPaths.add(sourceFile)
      console.log(`Inlined: ${importPath} into ${entry.clientJs}`)
    }

    await writeText(filePath, content)
  }
}
