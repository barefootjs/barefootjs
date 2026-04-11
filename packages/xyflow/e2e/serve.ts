/**
 * Minimal test server for @barefootjs/xyflow E2E tests.
 * Bundles xyflow + client + client-runtime on the fly and serves a test page.
 */

import { resolve } from 'path'

const ROOT = resolve(import.meta.dir, '..')
const CLIENT_ROOT = resolve(ROOT, '../client')
const RUNTIME_ROOT = resolve(ROOT, '../client-runtime')

// Bundle @barefootjs/client for the browser
const clientBuild = await Bun.build({
  entrypoints: [resolve(CLIENT_ROOT, 'src/index.ts')],
  format: 'esm',
})

// Bundle @barefootjs/client-runtime for the browser (external client)
const runtimeBuild = await Bun.build({
  entrypoints: [resolve(RUNTIME_ROOT, 'src/index.ts')],
  format: 'esm',
  external: ['@barefootjs/client'],
})

// Bundle @barefootjs/xyflow for the browser (external client + client-runtime)
const xyflowBuild = await Bun.build({
  entrypoints: [resolve(ROOT, 'src/index.ts')],
  format: 'esm',
  external: ['@barefootjs/client', '@barefootjs/client-runtime'],
})

const clientJs = await clientBuild.outputs[0].text()
const runtimeJs = await runtimeBuild.outputs[0].text()
const xyflowJs = await xyflowBuild.outputs[0].text()

// Read the test HTML
const testHtml = await Bun.file(resolve(ROOT, 'e2e/test-page.html')).text()

const port = Number(process.env.PORT) || 3099

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/barefoot-client.js') {
      return new Response(clientJs, { headers: { 'Content-Type': 'application/javascript' } })
    }
    if (url.pathname === '/barefoot-client-runtime.js') {
      return new Response(runtimeJs, { headers: { 'Content-Type': 'application/javascript' } })
    }
    if (url.pathname === '/barefoot-xyflow.js') {
      return new Response(xyflowJs, { headers: { 'Content-Type': 'application/javascript' } })
    }
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(testHtml, { headers: { 'Content-Type': 'text/html' } })
    }

    return new Response('Not found', { status: 404 })
  },
})

console.log(`Test server running at http://localhost:${port}`)
