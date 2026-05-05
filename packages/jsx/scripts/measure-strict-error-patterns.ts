/**
 * Phase 1 of #1187: dry-run measurement of strict-error patterns.
 *
 * Compiles every `.tsx` file under `site/ui/` and tabulates the patterns
 * that would become hard errors once strict-stage-boundary mode lands
 * (#1187 phase 5). The aggregate output drives Phase 3 design: which
 * callees are common enough to deserve dedicated registry entries vs
 * which are corner cases users can fix with `/* @client *\/`.
 *
 * Usage:
 *   bun run packages/jsx/scripts/measure-strict-error-patterns.ts
 *
 * What we count:
 *
 *   1. BF061 warnings (already emitted by #1186) — chained const that
 *      references an init-local from template scope. The diagnostic itself
 *      already names the leaf, so we group by leaf identifier.
 *
 *   2. Silent template fallbacks — substring `(undefined)` in generated
 *      client JS, which is the `UNSAFE_TEMPLATE_EXPR` sentinel substituted
 *      by `html-template.ts:transformExpr`. Heuristic but reliable: the
 *      sentinel only appears in template lambdas and only when a fallback
 *      fired.
 *
 *   3. Files compiled, files with errors of `severity:'error'`. If the
 *      pre-existing repo has zero error-severity diagnostics, this is the
 *      baseline strict-error mode would build on.
 */

import { compileJSX } from '../src/compiler'
import { HonoAdapter } from '../../adapter-hono/src/adapter/hono-adapter'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SITE_UI_ROOT = resolve(import.meta.dir, '../../../site/ui')

function walkTsxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry.startsWith('.') || entry === 'e2e') continue
      out.push(...walkTsxFiles(full))
    } else if (entry.endsWith('.tsx') && !entry.endsWith('.test.tsx')) {
      out.push(full)
    }
  }
  return out
}

interface FileReport {
  path: string
  compileError?: string
  errorCount: number
  bf061Leaves: string[]
  fallbackCount: number
}

function measureFile(path: string): FileReport {
  const source = readFileSync(path, 'utf8')
  const adapter = new HonoAdapter()

  let compileError: string | undefined
  let errors: ReturnType<typeof compileJSX>['errors'] = []
  let clientJs = ''

  try {
    const result = compileJSX(source, path, { adapter })
    errors = result.errors
    clientJs = result.files.find((f) => f.type === 'clientJs')?.content ?? ''
  } catch (e) {
    compileError = (e as Error).message
  }

  // BF061 messages name the leaf binding inside single quotes:
  // "Init-scope local 'cachedViewport' referenced from template scope (via const 'view'). ..."
  const bf061Leaves: string[] = []
  for (const err of errors) {
    if (err.code !== 'BF061') continue
    const match = err.message.match(/'([^']+)' referenced from template scope/)
    if (match) bf061Leaves.push(match[1])
  }

  // `(undefined)` only appears as the UNSAFE_TEMPLATE_EXPR substitution.
  // Count occurrences as a proxy for silent fallback density.
  const fallbackCount = (clientJs.match(/\(undefined\)/g) ?? []).length

  return {
    path,
    compileError,
    errorCount: errors.filter((e) => e.severity === 'error').length,
    bf061Leaves,
    fallbackCount,
  }
}

function main() {
  const files = walkTsxFiles(SITE_UI_ROOT)
  const reports = files.map(measureFile)

  const compiled = reports.filter((r) => !r.compileError)
  const failedCompile = reports.filter((r) => r.compileError)
  const withErrors = compiled.filter((r) => r.errorCount > 0)
  const withBF061 = compiled.filter((r) => r.bf061Leaves.length > 0)
  const withFallback = compiled.filter((r) => r.fallbackCount > 0)

  // Aggregate BF061 leaves by frequency
  const leafFreq = new Map<string, number>()
  for (const r of compiled) {
    for (const leaf of r.bf061Leaves) {
      leafFreq.set(leaf, (leafFreq.get(leaf) ?? 0) + 1)
    }
  }
  const topLeaves = [...leafFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)

  // Aggregate fallback density
  const totalFallbacks = compiled.reduce((sum, r) => sum + r.fallbackCount, 0)

  console.log('=== Phase 1 strict-error measurement ===')
  console.log(`Root: ${SITE_UI_ROOT}`)
  console.log()
  console.log('Files:')
  console.log(`  scanned                 ${reports.length}`)
  console.log(`  compiled OK             ${compiled.length}`)
  console.log(`  compilation threw       ${failedCompile.length}`)
  console.log()
  console.log('Pre-existing diagnostics in compiled files:')
  console.log(`  files with error-severity entries  ${withErrors.length}`)
  console.log(`  files emitting BF061 (warning)     ${withBF061.length}`)
  console.log(`  total BF061 occurrences            ${[...leafFreq.values()].reduce((a, b) => a + b, 0)}`)
  console.log()
  console.log('Silent template fallbacks (heuristic: `(undefined)` in client JS):')
  console.log(`  files containing fallbacks  ${withFallback.length}`)
  console.log(`  total fallback occurrences  ${totalFallbacks}`)
  console.log()
  if (topLeaves.length > 0) {
    console.log('Top BF061 leaf identifiers:')
    for (const [leaf, count] of topLeaves) {
      console.log(`  ${count.toString().padStart(4)}  ${leaf}`)
    }
    console.log()
  }
  if (withFallback.length > 0) {
    console.log('Files with silent fallbacks (sorted by occurrence count):')
    const sorted = [...withFallback].sort((a, b) => b.fallbackCount - a.fallbackCount)
    for (const r of sorted) {
      const rel = r.path.replace(SITE_UI_ROOT + '/', '')
      console.log(`  ${r.fallbackCount.toString().padStart(4)}  ${rel}`)
    }
    console.log()
  }
  if (failedCompile.length > 0) {
    console.log('Compilation throws (first 5):')
    for (const r of failedCompile.slice(0, 5)) {
      const rel = r.path.replace(SITE_UI_ROOT + '/', '')
      console.log(`  ${rel}: ${r.compileError?.slice(0, 200)}`)
    }
    console.log()
  }
}

main()
