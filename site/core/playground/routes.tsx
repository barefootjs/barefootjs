/**
 * Playground routes.
 *
 * Serves GET /playground with a self-contained HTML page: Monaco editor,
 * a compiler web worker, and a live-preview iframe using the BarefootJS
 * client runtime.
 *
 * The worker and page-script bundles are produced by build.ts and served
 * from /static/playground/.
 */

import { Hono } from 'hono'

const DEFAULT_SOURCE = `'use client'

import { createSignal } from '@barefootjs/client'

export function Counter() {
  const [count, setCount] = createSignal(0)
  return (
    <div style={{ padding: '12px 16px', border: '1px solid #ccc', borderRadius: '8px', display: 'inline-block' }}>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>+1</button>
      <button onClick={() => setCount(count() - 1)} style={{ marginLeft: '8px' }}>-1</button>
    </div>
  )
}
`

export function createPlaygroundApp() {
  const app = new Hono()

  app.get('/', (c) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Playground — Barefoot.js</title>
  <meta name="description" content="In-browser playground for BarefootJS: edit JSX, see the compiled output, and preview live." />
  <link rel="icon" type="image/png" sizes="32x32" href="/static/icon-32.png" />
  <link rel="stylesheet" href="/static/globals.css" />
  <link rel="stylesheet" href="/static/uno.css" />
  <style>
    html, body { height: 100%; margin: 0; }
    body { font-family: var(--font-sans, system-ui, sans-serif); background: var(--background, #fff); color: var(--foreground, #111); display: flex; flex-direction: column; }
    .pg-header { padding: 10px 16px; border-bottom: 1px solid var(--border, #e5e7eb); display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .pg-header a { color: inherit; text-decoration: none; font-weight: 600; }
    .pg-status { margin-left: auto; font: 12px ui-monospace, monospace; color: var(--muted-foreground, #666); }
    .pg-main { flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 0; }
    @media (max-width: 900px) { .pg-main { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } }
    .pg-pane { display: flex; flex-direction: column; min-height: 0; min-width: 0; border-right: 1px solid var(--border, #e5e7eb); }
    .pg-pane:last-child { border-right: none; }
    .pg-pane-header { padding: 6px 12px; font: 12px ui-monospace, monospace; color: var(--muted-foreground, #666); border-bottom: 1px solid var(--border, #e5e7eb); display: flex; gap: 4px; align-items: center; }
    .pg-editor { flex: 1; min-height: 0; }
    .pg-tab { background: transparent; border: 1px solid transparent; padding: 3px 10px; border-radius: 4px; font: inherit; color: inherit; cursor: pointer; }
    .pg-tab[aria-selected="true"] { border-color: var(--border, #e5e7eb); background: var(--muted, #f5f5f5); }
    .pg-tab-body { flex: 1; min-height: 0; overflow: auto; }
    .pg-tab-body[hidden] { display: none; }
    #pg-preview { width: 100%; height: 100%; border: 0; background: #fff; display: block; }
    .pg-code { margin: 0; padding: 12px; font: 12px/1.5 ui-monospace, monospace; white-space: pre; background: var(--muted, #f5f5f5); height: 100%; box-sizing: border-box; }
    #pg-error { margin: 0; padding: 10px 16px; font: 12px/1.4 ui-monospace, monospace; color: #c00; background: #fff5f5; border-top: 1px solid #fcc; white-space: pre-wrap; flex-shrink: 0; }
    #pg-error[hidden] { display: none; }
  </style>
</head>
<body>
  <header class="pg-header">
    <a href="/">← Barefoot.js</a>
    <span style="color: var(--muted-foreground, #666); font-size: 14px;">Playground</span>
    <span id="pg-status" class="pg-status">Loading…</span>
  </header>
  <div class="pg-main">
    <section class="pg-pane">
      <div class="pg-pane-header">component.tsx</div>
      <div id="pg-editor" class="pg-editor"></div>
    </section>
    <section class="pg-pane">
      <div class="pg-pane-header" role="tablist">
        <button id="pg-tab-button-preview" class="pg-tab" data-pg-tab="preview" role="tab" aria-selected="true" aria-controls="pg-tab-preview">Preview</button>
        <button id="pg-tab-button-ir" class="pg-tab" data-pg-tab="ir" role="tab" aria-selected="false" aria-controls="pg-tab-ir">IR</button>
        <button id="pg-tab-button-clientjs" class="pg-tab" data-pg-tab="clientJs" role="tab" aria-selected="false" aria-controls="pg-tab-clientjs">Client JS</button>
      </div>
      <div class="pg-tab-body" id="pg-tab-preview" role="tabpanel" aria-labelledby="pg-tab-button-preview"><iframe id="pg-preview" sandbox="allow-scripts" title="Preview"></iframe></div>
      <div class="pg-tab-body" id="pg-tab-ir" role="tabpanel" aria-labelledby="pg-tab-button-ir" hidden><pre id="pg-ir" class="pg-code"></pre></div>
      <div class="pg-tab-body" id="pg-tab-clientjs" role="tabpanel" aria-labelledby="pg-tab-button-clientjs" hidden><pre id="pg-clientjs" class="pg-code"></pre></div>
    </section>
  </div>
  <pre id="pg-error" hidden></pre>
  <script>
    window.PLAYGROUND_WORKER_URL = '/static/playground/worker.js'
    window.PLAYGROUND_INITIAL_SOURCE = ${JSON.stringify(DEFAULT_SOURCE)};
  </script>
  <script type="module" src="/static/playground/page.js"></script>
</body>
</html>`

    return c.html(html)
  })

  return app
}
