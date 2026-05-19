// Resolve a component name or file path to a source file + optional component name.
//
// Resolution order:
// 1. Direct file path (absolute or relative)
// 2. ui/components/ui/<name>/index.tsx (monorepo layout)
// 3. project-config `paths.components` (where `bf add` lands registry items)
// 4. `barefoot.config.ts`'s `components` source dirs (where the user
//    keeps their own app components — e.g. the scaffold's
//    `components/Counter.tsx`)
// 5. Current working directory (PascalCase fallback)

import { existsSync } from 'fs'
import path from 'path'
import type { CliContext } from '../context'

export interface ResolvedSource {
  filePath: string
  componentName?: string
}

/**
 * Try a single candidate path and return it (resolved) if the file exists.
 * Always appends to `searched` so callers can build a transcript for error messages.
 */
function tryCandidate(candidate: string, searched: string[]): string | null {
  searched.push(candidate)
  return existsSync(candidate) ? candidate : null
}

export function resolveComponentSource(
  nameOrPath: string,
  ctx: CliContext,
  searched: string[] = [],
): ResolvedSource | null {
  // 1. Direct file path
  if (nameOrPath.endsWith('.tsx') || nameOrPath.endsWith('.ts')) {
    const abs = path.isAbsolute(nameOrPath) ? nameOrPath : path.resolve(nameOrPath)
    const hit = tryCandidate(abs, searched)
    if (hit) return { filePath: hit }
  }

  // 2. ui/components/ui/<name>/index.tsx (monorepo). Skip the candidate
  //    entirely when the monorepo root isn't present — in a scaffolded
  //    app `ctx.root` resolves to `node_modules/`, and listing
  //    `node_modules/ui/components/ui/...` in error transcripts is
  //    noise that confuses users about where their components are.
  if (existsSync(path.join(ctx.root, 'ui/components/ui'))) {
    const monoHit = tryCandidate(
      path.join(ctx.root, 'ui/components/ui', nameOrPath, 'index.tsx'),
      searched,
    )
    if (monoHit) return { filePath: monoHit }
  }

  // 3. paths.components from barefoot.config.ts (registry-item layout)
  if (ctx.config && ctx.projectDir) {
    const configIndex = tryCandidate(
      path.join(ctx.projectDir, ctx.config.paths.components, nameOrPath, 'index.tsx'),
      searched,
    )
    if (configIndex) return { filePath: configIndex }

    const configFlat = tryCandidate(
      path.join(ctx.projectDir, ctx.config.paths.components, `${nameOrPath}.tsx`),
      searched,
    )
    if (configFlat) return { filePath: configFlat }

    // 4. Source dirs from barefoot.config.ts's `components` array. The
    //    scaffold puts user-authored components (Counter.tsx) here, not
    //    under `paths.components`. Try both flat (Counter.tsx) and
    //    nested (Counter/index.tsx) layouts.
    for (const dir of ctx.config.sourceDirs ?? []) {
      const flat = tryCandidate(
        path.join(ctx.projectDir, dir, `${nameOrPath}.tsx`),
        searched,
      )
      if (flat) return { filePath: flat }
      const nested = tryCandidate(
        path.join(ctx.projectDir, dir, nameOrPath, 'index.tsx'),
        searched,
      )
      if (nested) return { filePath: nested }
    }
  }

  // 5. PascalCase component name in the current working directory
  const cwdHit = tryCandidate(path.resolve(`${nameOrPath}.tsx`), searched)
  if (cwdHit) return { filePath: cwdHit }

  return null
}
