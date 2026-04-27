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
 *
 * Also emits `export { ... } [from './path']` specifier-list declarations
 * captured by the analyzer as `namedExports`. Specifiers whose local name
 * matches an already inline-exported local declaration (`export const`,
 * `export function`) or a component name that the compiler will rewrite
 * to `export function ComponentName` are filtered out to avoid duplicate
 * exports — except when the source is a re-export (`from './path'`),
 * where the specifier refers to a foreign binding and is always preserved.
 *
 * In a multi-component file the caller may pass `extraInlineExported` —
 * the union of inline-exported names across all sibling components in the
 * file — so the named-export block filter matches what will actually be
 * inline-exported in the combined output. Otherwise the only inline-export
 * the filter knows about is this component's own exports, which causes
 * the per-component blocks to differ from each other and the line-dedup
 * pass downstream to keep all of them, producing duplicate-export
 * SyntaxErrors.
 */
export function generateModuleExports(
  ir: ComponentIR,
  extraInlineExported: ReadonlySet<string> = new Set()
): string | null {
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

  // Emit specifier-list export blocks (`export { A, B } [from './path']`).
  // For non-from blocks we drop specifiers that bind to locals already
  // emitted with an inline `export` keyword above (constants/functions) or
  // a component name that will be rewritten to `export function Name`.
  // Listing them again as `export { X }` would produce a duplicate-binding
  // error. `from`-form blocks (re-exports of foreign bindings) are always
  // preserved verbatim — the specifier never collides with a local
  // declaration.
  const inlineExported = collectInlineExportedNames(ir)
  for (const name of extraInlineExported) inlineExported.add(name)

  for (const block of ir.metadata.namedExports) {
    const isReexportFrom = block.source !== null

    const survivingSpecs = block.specifiers.filter((spec) => {
      if (isReexportFrom) return true
      // Only drop the specifier when it would produce a *duplicate* of an
      // existing inline export — i.e. the specifier exports under the
      // same name as the inline declaration. `export { X as Y }` with
      // an inline `export const X` is NOT a duplicate (it adds the
      // external name `Y`), so the alias form must be preserved.
      const externalName = spec.alias ?? spec.name
      return !(inlineExported.has(spec.name) && externalName === spec.name)
    })

    if (survivingSpecs.length === 0) continue

    const specText = survivingSpecs
      .map((s) => {
        const prefix = s.isTypeOnly ? 'type ' : ''
        return s.alias ? `${prefix}${s.name} as ${s.alias}` : `${prefix}${s.name}`
      })
      .join(', ')
    const typeKw = block.isTypeOnly ? 'type ' : ''
    if (isReexportFrom) {
      lines.push(`export ${typeKw}{ ${specText} } from '${block.source}'`)
    } else {
      lines.push(`export ${typeKw}{ ${specText} }`)
    }
  }

  return lines.length > 0 ? lines.join('\n') : null
}

/**
 * Set of local binding names that are already emitted inline-exported
 * (`export const X = ...`, `export function X(...)`, or the component
 * itself, which the compiler rewrites from `function Name` to
 * `export function Name`). Used by `generateModuleExports` to avoid
 * double-exporting via a trailing `export { ... }` block.
 */
export function collectInlineExportedNames(ir: ComponentIR): Set<string> {
  const names = new Set<string>()
  for (const c of ir.metadata.localConstants) {
    if (c.isExported) names.add(c.name)
  }
  for (const f of ir.metadata.localFunctions) {
    if (f.isExported) names.add(f.name)
  }
  // The component itself is rewritten to `export function ComponentName`
  // by `applyExportKeyword` in compiler.ts when `metadata.isExported` is
  // true — including the case where the source uses a trailing
  // `export { ComponentName }` block. Filter that specifier out so the
  // trailing block doesn't re-list it.
  if (ir.metadata.isExported && ir.metadata.componentName) {
    names.add(ir.metadata.componentName)
  }
  return names
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
