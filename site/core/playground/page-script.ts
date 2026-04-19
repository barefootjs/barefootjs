/**
 * Client-side controller for the playground page.
 *
 * Bootstraps Monaco (from esm.sh), spawns the compiler worker, and
 * re-renders the preview iframe whenever compilation succeeds.
 *
 * Exported as a string (via `?raw` in the route) and injected inline so the
 * page stays self-contained without extra asset routing.
 */

// This file is bundled as a standalone ES module and served at
// /static/playground/page.js.

// @ts-ignore - importmap-resolved module
import type * as MonacoNS from 'monaco-editor'

declare global {
  interface Window {
    PLAYGROUND_WORKER_URL: string
    PLAYGROUND_INITIAL_SOURCE: string
  }
}

type Tab = 'preview' | 'ir' | 'clientJs'

const MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'

/**
 * Build the srcdoc for the preview iframe. Kept in sync with
 * playground/iframe-template.ts — duplicated here so the client bundle has no
 * server-side dependency.
 */
function buildIframeSrcdoc(opts: {
  clientJs: string
  componentName: string
  propsJson?: string
}): string {
  const { clientJs, componentName, propsJson = '{}' } = opts
  const importMap = JSON.stringify({
    imports: {
      '@barefootjs/client': '/static/components/barefoot.js',
      '@barefootjs/client/runtime': '/static/components/barefoot.js',
    },
  })
  // Strip compiler-emitted side-effect markers like
  //   import '/* @bf-child:Foo */'
  // They're build-pipeline hints (not real modules) and would fail to fetch
  // inside the iframe.
  const cleanedClientJs = clientJs.replace(
    /^\s*import\s+['"][^'"]*@bf-child:[^'"]*['"]\s*;?\s*$/gm,
    '',
  )
  const safeClientJs = cleanedClientJs.replace(/<\/script/gi, '<\\/script')
  const safeComponentName = JSON.stringify(componentName)
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <script type="importmap">${importMap}</script>
    <style>
      :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
      body { margin: 0; padding: 16px; }
      #app:empty::before {
        content: 'Preview is empty — did your component return JSX?';
        color: #888;
        font-size: 13px;
      }
      #playground-error {
        position: fixed; inset: 0; padding: 16px;
        background: #fff5f5; color: #a00;
        font: 12px/1.4 ui-monospace, monospace;
        white-space: pre-wrap; overflow: auto;
        display: none;
      }
    </style>
    <script>
      // Classic script: runs before module scripts, so the handlers are live
      // even if the module below has a parse error or top-level rejection.
      function __pgReportError(err) {
        var el = document.getElementById('playground-error')
        if (!el) return
        el.textContent = err && err.stack ? err.stack : String(err)
        el.style.display = 'block'
      }
      window.addEventListener('error', function (e) { __pgReportError(e.error || e.message) })
      window.addEventListener('unhandledrejection', function (e) { __pgReportError(e.reason) })
    </script>
  </head>
  <body>
    <div id="app"></div>
    <pre id="playground-error"></pre>
    <script type="module">
      // Compiled client JS lives at module top-level so its static \`import\`
      // and \`export\` statements are valid. hydrate() calls at the bottom of
      // the compiler output register the component into the runtime's
      // registry before render() consumes it below.
      ${safeClientJs}

      const { render } = await import('@barefootjs/client/runtime')
      try {
        render(document.getElementById('app'), ${safeComponentName}, ${propsJson})
      } catch (err) {
        __pgReportError(err)
      }
    </script>
  </body>
</html>`
}

function loadMonaco(): Promise<typeof MonacoNS> {
  return new Promise((resolve, reject) => {
    const loaderScript = document.createElement('script')
    loaderScript.src = `${MONACO_CDN}/loader.js`
    loaderScript.onload = () => {
      const require = (window as any).require
      require.config({ paths: { vs: MONACO_CDN } })
      require(['vs/editor/editor.main'], () => {
        resolve((window as any).monaco)
      })
    }
    loaderScript.onerror = () =>
      reject(new Error('Failed to load Monaco editor from CDN'))
    document.head.appendChild(loaderScript)
  })
}

async function main() {
  const editorEl = document.getElementById('pg-editor')!
  const previewFrame = document.getElementById(
    'pg-preview',
  ) as HTMLIFrameElement
  const irPanel = document.getElementById('pg-ir')!
  const clientJsPanel = document.getElementById('pg-clientjs')!
  const statusEl = document.getElementById('pg-status')!
  const errorEl = document.getElementById('pg-error')!
  const tabButtons = document.querySelectorAll<HTMLButtonElement>(
    '[data-pg-tab]',
  )
  const tabPanels: Record<Tab, HTMLElement> = {
    preview: document.getElementById('pg-tab-preview')!,
    ir: document.getElementById('pg-tab-ir')!,
    clientJs: document.getElementById('pg-tab-clientjs')!,
  }

  function setTab(tab: Tab) {
    for (const btn of tabButtons) {
      const isActive = btn.dataset.pgTab === tab
      btn.setAttribute('aria-selected', String(isActive))
      btn.classList.toggle('pg-tab-active', isActive)
    }
    for (const [key, panel] of Object.entries(tabPanels)) {
      panel.hidden = key !== tab
    }
  }
  for (const btn of tabButtons) {
    btn.addEventListener('click', () => setTab(btn.dataset.pgTab as Tab))
  }
  setTab('preview')

  statusEl.textContent = 'Loading editor…'
  const monaco = await loadMonaco()

  const editor = monaco.editor.create(editorEl, {
    value: window.PLAYGROUND_INITIAL_SOURCE,
    language: 'typescript',
    theme: matchMedia('(prefers-color-scheme: dark)').matches
      ? 'vs-dark'
      : 'vs',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    tabSize: 2,
    scrollBeyondLastLine: false,
  })

  // Let Monaco treat the buffer as TSX.
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.Preserve,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
    noEmit: true,
  })
  // Suppress cross-file diagnostics (we have no real project here).
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  })

  statusEl.textContent = 'Starting compiler…'
  const worker = new Worker(window.PLAYGROUND_WORKER_URL, { type: 'module' })

  let nextId = 1
  let ready = false
  let pendingSource: string | null = null
  let debounceHandle: number | null = null

  function showErrors(errors: { severity: string; message: string }[]) {
    errorEl.hidden = false
    errorEl.textContent = errors
      .map((e) => `[${e.severity}] ${e.message}`)
      .join('\n\n')
  }
  function clearErrors() {
    errorEl.hidden = true
    errorEl.textContent = ''
  }

  function send(source: string) {
    if (!ready) {
      pendingSource = source
      return
    }
    statusEl.textContent = 'Compiling…'
    worker.postMessage({ id: nextId++, source })
  }

  worker.addEventListener('message', (event) => {
    const msg = event.data
    if (msg && msg.ready === true) {
      ready = true
      statusEl.textContent = 'Ready'
      if (pendingSource !== null) {
        const src = pendingSource
        pendingSource = null
        send(src)
      } else {
        send(editor.getValue())
      }
      return
    }

    if (msg.ok === false) {
      showErrors(msg.errors)
      statusEl.textContent = 'Errors'
      return
    }

    clearErrors()
    statusEl.textContent = msg.warnings?.length
      ? `Compiled (${msg.warnings.length} warning${msg.warnings.length === 1 ? '' : 's'})`
      : 'Compiled'

    clientJsPanel.textContent = msg.clientJs
    irPanel.textContent = JSON.stringify(msg.ir, null, 2)

    previewFrame.srcdoc = buildIframeSrcdoc({
      clientJs: msg.clientJs,
      componentName: msg.componentName,
    })
  })

  worker.addEventListener('error', (e) => {
    showErrors([
      { severity: 'error', message: `Worker crashed: ${e.message}` },
    ])
  })

  function scheduleCompile() {
    if (debounceHandle !== null) clearTimeout(debounceHandle)
    debounceHandle = window.setTimeout(() => {
      send(editor.getValue())
    }, 400)
  }
  editor.onDidChangeModelContent(scheduleCompile)
}

main().catch((err) => {
  const status = document.getElementById('pg-status')
  if (status) status.textContent = 'Failed to initialise'
  const errorEl = document.getElementById('pg-error')
  if (errorEl) {
    errorEl.hidden = false
    errorEl.textContent = err && err.stack ? err.stack : String(err)
  }
})
