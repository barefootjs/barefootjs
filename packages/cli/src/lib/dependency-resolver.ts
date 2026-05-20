// Source-of-truth dependency resolver for `bf add` in monorepo mode.
//
// `ui/meta/<name>.json` is a derived artefact and can drift between
// `bf meta extract` runs. Trusting it to enumerate sibling dependencies
// caused #1435 — `bf add checkbox` shipped a project that failed to
// bundle because the stale meta still declared
// `dependencies.internal: []` even though `checkbox/index.tsx` had
// grown an `import { CheckIcon } from '../icon'`. Parsing the source
// directly removes that drift surface entirely.

import { existsSync, readFileSync } from 'fs'
import path from 'path'

/**
 * Resolve transitive internal dependencies by scanning each component's
 * `<srcComponentsDir>/<name>/index.tsx` for `../<sibling>` imports.
 *
 * A sibling is only followed if `<srcComponentsDir>/<sibling>/index.tsx`
 * actually exists, so co-located helpers and shared util folders are
 * silently ignored. Returns a sorted, deduplicated list including the
 * requested components and their transitive sibling closure.
 */
export function resolveDependenciesFromSource(
  requested: string[],
  srcComponentsDir: string,
): string[] {
  const visited = new Set<string>()
  const queue = [...requested]

  while (queue.length > 0) {
    const name = queue.shift()!
    if (visited.has(name)) continue
    visited.add(name)

    const srcFile = path.join(srcComponentsDir, name, 'index.tsx')
    if (!existsSync(srcFile)) continue

    const source = readFileSync(srcFile, 'utf-8')
    for (const dep of extractSiblingComponentImports(source)) {
      if (visited.has(dep)) continue
      if (existsSync(path.join(srcComponentsDir, dep, 'index.tsx'))) {
        queue.push(dep)
      }
    }
  }

  return [...visited].sort()
}

/**
 * Pull sibling component names out of `import ... from '../<name>'` and
 * `export ... from '../<name>'` statements. Type-only imports are
 * intentionally included — even if the bundler can elide them, the
 * tsc/IDE type-check still needs the file present in the user project.
 */
function extractSiblingComponentImports(source: string): string[] {
  const names = new Set<string>()
  const fromRegex = /(?:import|export)\s+[^'"`;]*?\sfrom\s*['"]([^'"]+)['"]/g

  let m: RegExpExecArray | null
  while ((m = fromRegex.exec(source)) !== null) {
    const sibling = m[1].match(/^\.\.\/([a-z][a-z0-9-]*)(?:\/.*)?$/)
    if (sibling) names.add(sibling[1])
  }
  return [...names]
}
