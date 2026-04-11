/**
 * BarefootJS Compiler - Module Exports Generation
 *
 * Generates module-level export statements from ComponentIR.
 * This is a compiler-layer concern, not adapter-specific.
 */

import type { ComponentIR, ParamInfo } from './types'

/**
 * Generate module-level export statements for constants and functions.
 * Skips client-only constructs (createContext, new WeakMap).
 */
export function generateModuleExports(ir: ComponentIR): string | null {
  const lines: string[] = []

  for (const constant of ir.metadata.localConstants) {
    if (!constant.isExported) continue
    const keyword = constant.declarationKind ?? 'const'
    if (!constant.value) {
      lines.push(`export ${keyword} ${constant.name}`)
      continue
    }
    const value = constant.value.trim()
    // Skip client-only constructs
    if (/^createContext\b/.test(value) || /^new WeakMap\b/.test(value)) continue

    lines.push(`export ${keyword} ${constant.name} = ${constant.value}`)
  }

  for (const func of ir.metadata.localFunctions) {
    if (!func.isExported) continue
    const params = func.params.map(formatParamWithType).join(', ')
    lines.push(`export function ${func.name}(${params}) ${func.body}`)
  }

  return lines.length > 0 ? lines.join('\n') : null
}

/**
 * Format a ParamInfo for .tsx output, preserving type annotations when available.
 */
export function formatParamWithType(p: ParamInfo): string {
  const typeAnnotation = p.type?.raw && p.type.raw !== 'unknown' ? `: ${p.type.raw}` : ''
  return `${p.name}${typeAnnotation}`
}

/**
 * Find names reachable from primary reference text via transitive dependency analysis.
 * Used to determine which SSR declarations are actually needed (vs. only used in event handlers).
 */
export function findReachableNames(
  primaryRefs: string,
  declarations: { name: string; body: string }[],
): Set<string> {
  const allNames = new Set(declarations.map(d => d.name))
  const bodyMap = new Map(declarations.map(d => [d.name, d.body]))
  const reachable = new Set<string>()
  const queue: string[] = []

  for (const name of allNames) {
    if (new RegExp(`\\b${name}\\b`).test(primaryRefs)) {
      reachable.add(name)
      queue.push(name)
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    const body = bodyMap.get(current) || ''
    for (const name of allNames) {
      if (!reachable.has(name) && new RegExp(`\\b${name}\\b`).test(body)) {
        reachable.add(name)
        queue.push(name)
      }
    }
  }

  return reachable
}

/**
 * Extract parameter names from a function expression string.
 * Handles: arrow functions, single-param arrows, function expressions.
 * Strips type annotations and default values.
 */
export function extractFunctionParams(value: string): string {
  // Match arrow function parameters: (a, b) => ... or async (a, b) => ...
  const arrowMatch = value.match(/^(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>/)
  if (arrowMatch) {
    return arrowMatch[1]
      .split(',')
      .map((p) => p.trim().split(':')[0].split('=')[0].trim())
      .filter(Boolean)
      .join(', ')
  }
  // Single param arrow function: a => ...
  const singleMatch = value.match(/^(?:async\s*)?(\w+)\s*=>/)
  if (singleMatch) {
    return singleMatch[1]
  }
  // Function expression: function(a, b) { ... }
  const funcMatch = value.match(/^(?:async\s*)?function\s*\w*\s*\(([^)]*)\)/)
  if (funcMatch) {
    return funcMatch[1]
      .split(',')
      .map((p) => p.trim().split(':')[0].split('=')[0].trim())
      .filter(Boolean)
      .join(', ')
  }
  return ''
}
