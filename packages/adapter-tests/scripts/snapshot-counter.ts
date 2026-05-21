/**
 * One-off snapshot generator for the counter-shared fixture.
 *
 * Compiles `integrations/shared/components/Counter.tsx` via the Hono
 * adapter (SSR HTML) and the JSX client-JS compiler, then writes the
 * frozen pair next to the fixture.
 *
 * Usage: `bun run packages/adapter-tests/scripts/snapshot-counter.ts`
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderHonoComponent } from '@barefootjs/hono/test-render'
import { HonoAdapter } from '@barefootjs/hono/adapter'
import {
  analyzeComponent,
  buildMetadata,
  jsxToIR,
  generateClientJs,
  analyzeClientNeeds,
  type ComponentIR,
} from '@barefootjs/jsx'

const REPO_ROOT = resolve(import.meta.dir, '../../..')
const SOURCE_PATH = resolve(REPO_ROOT, 'integrations/shared/components/Counter.tsx')
const SNAPSHOT_DIR = resolve(import.meta.dir, '../fixtures/__snapshots__')

const source = readFileSync(SOURCE_PATH, 'utf8')

// Pass `__instanceId` shaped as `Counter_<token>` so the hydration walk's
// scopeName parser (`id.slice(0, id.indexOf('_'))`) resolves the registered
// `Counter` component. The conformance default of `__instanceId: 'test'`
// produces an underscore-less ID that the runtime cannot dispatch from —
// fine for HTML-only assertions, broken for fixture-hydrate.
const ssrHtml = await renderHonoComponent({
  source,
  adapter: new HonoAdapter(),
  props: { initial: 0, __instanceId: 'Counter_test' },
})

const ctx = analyzeComponent(source, 'Counter.tsx', 'Counter')
if (!ctx.jsxReturn) throw new Error('No JSX return found in Counter.tsx')
const ir = jsxToIR(ctx)
if (!ir) throw new Error('Failed to lower Counter.tsx to IR')
const componentIR: ComponentIR = {
  version: '0.1',
  metadata: buildMetadata(ctx),
  root: ir,
  errors: [],
}
componentIR.metadata.clientAnalysis = analyzeClientNeeds(componentIR)
const clientJs = generateClientJs(componentIR, ['Counter'])

writeFileSync(resolve(SNAPSHOT_DIR, 'counter-shared.html'), ssrHtml.trim() + '\n')
writeFileSync(resolve(SNAPSHOT_DIR, 'counter-shared.client.js'), clientJs.trimEnd() + '\n')

console.log(`Wrote ${SNAPSHOT_DIR}/counter-shared.html (${ssrHtml.length} bytes)`)
console.log(`Wrote ${SNAPSHOT_DIR}/counter-shared.client.js (${clientJs.length} bytes)`)
