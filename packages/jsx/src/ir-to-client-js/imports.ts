/**
 * Import detection and DOM import management.
 */

import type { ComponentIR } from '../types'

// All exports from @barefootjs/dom that may be used in generated code
export const DOM_IMPORT_CANDIDATES = [
  'createSignal', 'createMemo', 'createEffect', 'onCleanup', 'onMount',
  'hydrate', 'insert', 'reconcileElements', 'reconcileTemplates',
  'createComponent', 'renderChild', 'registerComponent', 'registerTemplate', 'initChild', 'updateClientMarker',
  'createPortal',
  'provideContext', 'createContext', 'useContext',
  'forwardProps', 'applyRestAttrs', 'splitProps',
] as const

export const IMPORT_PLACEHOLDER = '/* __BAREFOOTJS_DOM_IMPORTS__ */'
export const MODULE_CONSTANTS_PLACEHOLDER = '/* __MODULE_LEVEL_CONSTANTS__ */'

/**
 * Detect which @barefootjs/dom functions are actually used in the generated code
 */
export function detectUsedImports(code: string): Set<string> {
  const used = new Set<string>()
  for (const name of DOM_IMPORT_CANDIDATES) {
    // Match function calls: name(
    if (new RegExp(`\\b${name}\\s*\\(`).test(code)) {
      used.add(name)
    }
  }
  // Shorthand finders need special detection ($ is not a word character)
  if (/\$c\s*\(/.test(code)) {
    used.add('$c')
  }
  // Match $t( for text node finders
  if (/\$t\s*\(/.test(code)) {
    used.add('$t')
  }
  // Match $( but not $c( or $t( - use negative lookahead
  if (/\$\s*\(/.test(code)) {
    used.add('$')
  }
  return used
}

/**
 * Collect user-defined imports from @barefootjs/dom (preserve PR #248 behavior)
 */
export function collectUserDomImports(ir: ComponentIR): string[] {
  const userImports: string[] = []
  for (const imp of ir.metadata.imports) {
    if (imp.source === '@barefootjs/dom' && !imp.isTypeOnly) {
      for (const spec of imp.specifiers) {
        if (!spec.isDefault && !spec.isNamespace) {
          userImports.push(spec.alias ? `${spec.name} as ${spec.alias}` : spec.name)
        }
      }
    }
  }
  return userImports
}

/**
 * Collect external (non-DOM, non-component) imports that are used in generated code.
 * These are third-party libraries like @barefootjs/form, zod, etc. that need to be
 * preserved in client JS output so the browser can resolve them via import map.
 */
export function collectExternalImports(ir: ComponentIR, generatedCode: string): string[] {
  const importLines: string[] = []
  for (const imp of ir.metadata.imports) {
    // Skip type-only, DOM (handled separately), and component imports
    if (imp.isTypeOnly) continue
    if (imp.source === '@barefootjs/dom') continue
    if (imp.source.startsWith('@ui/') || imp.source.startsWith('@/') || imp.source.startsWith('./') || imp.source.startsWith('../')) continue

    // Check which specifiers are actually used in the generated code
    const usedSpecs: string[] = []
    for (const spec of imp.specifiers) {
      const localName = spec.alias || spec.name
      if (new RegExp(`\\b${localName}\\b`).test(generatedCode)) {
        usedSpecs.push(spec.alias ? `${spec.name} as ${spec.alias}` : spec.name)
      }
    }

    if (usedSpecs.length > 0) {
      importLines.push(`import { ${usedSpecs.join(', ')} } from '${imp.source}'`)
    }
  }
  return importLines
}
