// bf preview — compile a component's previews to a CSR bundle. Lives
// inside the CLI so it ships with @barefootjs/cli (no separate package,
// no cross-package source imports).

import { resolve, relative } from 'node:path'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { compile, type CompileResult } from './compile'
import { loadComponent } from '../meta-loader'
import { generatePreview } from '../preview-generate'

export interface RunPreviewOptions {
  /** Repo/project root (monorepo root or user project dir). */
  rootDir: string
  /** Directory containing previewable components (absolute). */
  uiDir: string
  /** Directory containing component meta JSON (absolute). */
  metaDir: string
  /** Inject a live-reload script into the page (watch mode). */
  liveReload?: boolean
}

// Thrown for expected, user-actionable failures so callers can decide
// whether to exit (one-shot) or log and keep watching.
export class PreviewError extends Error {}

export async function runPreview(componentName: string, opts: RunPreviewOptions): Promise<CompileResult> {
  const { rootDir, uiDir, metaDir, liveReload } = opts
  const previewsPath = resolve(uiDir, componentName, 'index.preview.tsx')

  // 1. Auto-generate preview if file doesn't exist
  if (!existsSync(previewsPath)) {
    try {
      const meta = loadComponent(metaDir, componentName)
      const result = generatePreview(meta)
      writeFileSync(previewsPath, result.code)
      console.log(`Auto-generated preview: ${relative(rootDir, previewsPath)}`)
    } catch {
      throw new PreviewError(
        `Preview file not found and auto-generation failed for "${componentName}".\n` +
        `Run: bf gen preview ${componentName}`,
      )
    }
  }

  // 2. Extract export names (function declarations and const/arrow exports)
  const source = readFileSync(previewsPath, 'utf-8')
  const previewNames = [
    ...source.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g),
    ...source.matchAll(/export\s+const\s+(\w+)\s*=/g),
  ].map(m => m[1])

  if (previewNames.length === 0) {
    throw new PreviewError('No exported preview functions found in the preview file.')
  }

  console.log(`Found ${previewNames.length} previews: ${previewNames.join(', ')}`)

  // 3. Compile (CSR bundle)
  return compile({ rootDir, previewsPath, previewNames, componentName, liveReload })
}
