/**
 * Hono test renderer
 *
 * Compiles JSX source with HonoAdapter and renders to HTML via Hono's app.request().
 * Used by adapter-tests conformance runner.
 */

import { compileJSX } from '@barefootjs/jsx'
import type { TemplateAdapter } from '@barefootjs/jsx'
import { Hono } from 'hono'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

// Place temp files inside the hono package so hono/jsx resolves correctly
const RENDER_TEMP_DIR = resolve(import.meta.dir, '../.render-temp')

export interface RenderOptions {
  /** JSX source code */
  source: string
  /** Template adapter to use */
  adapter: TemplateAdapter
  /** Props to inject (optional) */
  props?: Record<string, unknown>
  /** Additional component files (filename → source) */
  components?: Record<string, string>
  /**
   * Explicit component to render when the source declares multiple
   * exports. When omitted, the first function-valued export in
   * `Object.keys(mod)` iteration order is picked — that order is
   * alphabetical for dynamically imported ES modules in Bun/V8, so
   * relying on declaration order can pick the wrong component
   * (e.g. `PropsReactivityComparison` before `ReactiveProps`).
   */
  componentName?: string
}

/**
 * Drop module-level exports from a compiled marked template so it can be
 * inlined as plain declarations alongside other components. Specifier
 * blocks (`export { … }`, `export type { … }`, with or without a
 * trailing `from '…'` re-export source) are removed whole; declaration
 * forms (`export function/const/let/type/interface`, `export default`)
 * keep their body with only the leading keyword stripped.
 *
 * The set of forms is bounded by `generateModuleExports` in
 * @barefootjs/jsx — see the caller for the enumeration. This stays a
 * line-oriented text pass (rather than a real parse) because the input
 * is compiler-generated with a stable, single-line-per-export shape.
 */
function stripModuleExports(code: string): string {
  return code
    // `export [type] { … } [from '…']` specifier / re-export blocks.
    .replace(
      /^[ \t]*export\s+(?:type\s+)?\{[^}]*\}(?:[ \t]*from[ \t]*['"][^'"]*['"])?[ \t]*;?[ \t]*$/gm,
      '',
    )
    // Leading keyword on declaration forms (`export function`,
    // `export const X = …`, `export default …`, etc.).
    .replace(/\bexport\s+(default\s+)?/g, '')
}

export async function renderHonoComponent(options: RenderOptions): Promise<string> {
  const { source, adapter, props, components, componentName: requestedName } = options

  // Compile child components first
  const childCodes: string[] = []
  const componentKeys = new Set<string>()
  if (components) {
    for (const [filename, childSource] of Object.entries(components)) {
      componentKeys.add(filename)
      const childResult = compileJSX(childSource, filename, { adapter })
      const childErrors = childResult.errors.filter(e => e.severity === 'error')
      if (childErrors.length > 0) {
        throw new Error(`Compilation errors in ${filename}:\n${childErrors.map(e => e.message).join('\n')}`)
      }
      const childTemplate = childResult.files.find(f => f.type === 'markedTemplate')
      if (!childTemplate) throw new Error(`No marked template for ${filename}`)
      // Strip exports so only the parent component is exported, inlining
      // the child as plain top-level declarations. The marked template's
      // export forms are fixed by `generateModuleExports` (+ the
      // component's own `export function`) in @barefootjs/jsx, each on
      // its own line:
      //
      //   export const/let X = …      export function / async function …
      //   export type X = …           export interface X { … }
      //   export { A, B } [from '…']   export type { A } [from '…']
      //
      // The `export { … }` / `export type { … }` *specifier* blocks
      // (with or without a trailing `from '…'`) must be dropped whole —
      // their bindings are already declared inline, and naively removing
      // just the `export ` keyword leaves a bare `{ A }` / `type { A }`
      // (the latter a syntax error). Declaration forms keep their body;
      // only the leading `export `/`export default ` is removed.
      const localCode = stripModuleExports(childTemplate.content)
      childCodes.push(localCode)
    }
  }

  // Compile parent source
  const result = compileJSX(source, 'component.tsx', { adapter })

  const errors = result.errors.filter(e => e.severity === 'error')
  if (errors.length > 0) {
    throw new Error(`Compilation errors:\n${errors.map(e => e.message).join('\n')}`)
  }

  const templateFile = result.files.find(f => f.type === 'markedTemplate')
  if (!templateFile) throw new Error('No marked template in compile output')

  let parentCode = templateFile.content
  // Strip import lines that reference component files
  if (componentKeys.size > 0) {
    parentCode = parentCode
      .split('\n')
      .filter(line => {
        const importMatch = line.match(/^\s*import\s+.*from\s+['"](.+?)['"]/)
        if (!importMatch) return true
        const importPath = importMatch[1]
        // Match against component keys: './badge' matches './badge.tsx'
        for (const key of componentKeys) {
          const keyWithoutExt = key.replace(/\.tsx?$/, '')
          if (importPath === keyWithoutExt || importPath === key) return false
        }
        return true
      })
      .join('\n')
  }

  // Combine: JSX pragma + child compiled functions + parent compiled code
  const codeParts = ['/** @jsxImportSource hono/jsx */']
  for (const childCode of childCodes) {
    codeParts.push(childCode)
  }
  codeParts.push(parentCode)
  const code = codeParts.join('\n')

  await mkdir(RENDER_TEMP_DIR, { recursive: true })
  // Unique filename per render to avoid Bun's process-level module cache
  // (bun#12371: re-importing the same path returns stale module)
  const tempFile = resolve(
    RENDER_TEMP_DIR,
    `render-${Date.now()}-${Math.random().toString(36).slice(2)}.tsx`,
  )
  await Bun.write(tempFile, code)

  try {
    const mod = await import(tempFile)

    // Explicit `componentName` wins; otherwise pick the first
    // function-valued export. `Object.keys` for dynamically imported
    // modules iterates alphabetically in Bun/V8, so the fallback can
    // surprise multi-component files — pass `componentName` to pin.
    let resolvedName: string | undefined = requestedName
    if (resolvedName) {
      if (typeof mod[resolvedName] !== 'function') {
        const available = Object.keys(mod).filter(k => typeof mod[k] === 'function')
        throw new Error(
          `Requested component "${resolvedName}" not found in compiled module. Available: ${available.join(', ')}`,
        )
      }
    } else {
      resolvedName = Object.keys(mod).find(k => typeof mod[k] === 'function')
      if (!resolvedName) throw new Error('No component function found in compiled module')
    }

    const Component = mod[resolvedName]

    // Render using Hono's app.request()
    const app = new Hono()
    app.get('/', (c) =>
      c.html(Component({ __instanceId: 'test', __bfChild: false, ...props })),
    )

    const res = await app.request('/')
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Render failed with status ${res.status}: ${body}`)
    }
    return await res.text()
  } finally {
    await rm(tempFile, { force: true }).catch(() => {})
  }
}
