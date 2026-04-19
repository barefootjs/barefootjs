/**
 * Playground compiler worker.
 *
 * Runs entirely in the browser: accepts JSX source, invokes the BarefootJS
 * compiler (with TypeScript bundled in), and returns the generated Client JS
 * plus the component name so the main thread can mount it into a preview
 * iframe.
 */

import {
  analyzeComponent,
  buildMetadata,
  jsxToIR,
  generateClientJs,
  analyzeClientNeeds,
  listComponentFunctions,
  type ComponentIR,
} from '@barefootjs/jsx'
import { HonoAdapter } from '@barefootjs/hono/adapter'

type CompileRequest = {
  id: number
  source: string
}

type CompilerError = { severity: string; message: string }

type CompileResponse =
  | {
      id: number
      ok: true
      componentName: string
      clientJs: string
      template: string
      ir: ComponentIR
      warnings: CompilerError[]
    }
  | {
      id: number
      ok: false
      errors: CompilerError[]
    }

const VIRTUAL_PATH = '/playground/component.tsx'
const adapter = new HonoAdapter()

function compile(source: string): CompileResponse | null {
  const names = listComponentFunctions(source, VIRTUAL_PATH)
  if (names.length === 0) {
    return {
      id: 0,
      ok: false,
      errors: [
        {
          severity: 'error',
          message:
            'No component function found. Add a PascalCase function that returns JSX.',
        },
      ],
    }
  }

  // Use the last detected component as the entry (so helper components above
  // it are still compiled into the same bundle via child registration).
  const entryName = names[names.length - 1]
  const ctx = analyzeComponent(source, VIRTUAL_PATH, entryName)
  const errors = ctx.errors.filter((e) => e.severity === 'error')
  const warnings = ctx.errors.filter((e) => e.severity === 'warning')

  if (errors.length > 0) {
    return { id: 0, ok: false, errors }
  }

  if (!ctx.jsxReturn) {
    return {
      id: 0,
      ok: false,
      errors: [
        { severity: 'error', message: 'Component has no JSX return value.' },
      ],
    }
  }

  const ir = jsxToIR(ctx)
  // jsxToIR can surface new errors into ctx.errors — re-check before emitting.
  const postIrErrors = ctx.errors.filter((e) => e.severity === 'error')
  if (postIrErrors.length > 0) {
    return { id: 0, ok: false, errors: postIrErrors }
  }
  if (!ir) {
    return {
      id: 0,
      ok: false,
      errors: [
        { severity: 'error', message: 'Failed to build IR for component.' },
      ],
    }
  }

  const componentIR: ComponentIR = {
    version: '0.1',
    metadata: buildMetadata(ctx),
    root: ir,
    errors: [],
  }
  componentIR.metadata.clientAnalysis = analyzeClientNeeds(componentIR)

  const clientJs = generateClientJs(componentIR)
  let template = ''
  try {
    template = adapter.generate(componentIR).template
  } catch (err) {
    template = `// Adapter failed to generate template: ${
      err instanceof Error ? err.message : String(err)
    }`
  }

  return {
    id: 0,
    ok: true,
    componentName: entryName,
    clientJs,
    template,
    ir: componentIR,
    warnings,
  }
}

self.addEventListener('message', (event: MessageEvent<CompileRequest>) => {
  const { id, source } = event.data
  try {
    const result = compile(source)
    if (result) {
      ;(self as unknown as Worker).postMessage({ ...result, id })
    }
  } catch (err) {
    const message = err instanceof Error ? err.stack || err.message : String(err)
    ;(self as unknown as Worker).postMessage({
      id,
      ok: false,
      errors: [{ severity: 'error', message }],
    } satisfies CompileResponse)
  }
})

// Signal readiness — main thread waits for this before sending the first job.
;(self as unknown as Worker).postMessage({ id: -1, ready: true })
