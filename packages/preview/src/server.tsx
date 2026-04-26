/**
 * Preview development server
 *
 * Lightweight Hono server that renders previews with full hydration support.
 * Uses BfScripts/BfPortals from @barefootjs/adapter-hono.
 * Compiled components' hono imports are rewritten to the same hono instance
 * in compile.ts to ensure consistent request context sharing.
 */

/** @jsxImportSource hono/jsx */

import { Hono } from 'hono'
import { jsxRenderer, useRequestContext } from 'hono/jsx-renderer'
import { serveStatic } from 'hono/bun'
import { BfScripts } from '@barefootjs/adapter-hono/scripts'
import { BfPortals } from '@barefootjs/adapter-hono/portals'

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props?: {}): Response | Promise<Response>
  }
}

/**
 * Predictable instance ID generator (same as site/ui/renderer.tsx)
 */
const createPredictableIdGenerator = () => {
  const counters = new Map<string, number>()
  return (name: string) => {
    const count = counters.get(name) || 0
    counters.set(name, count + 1)
    return `${name}_${count}`
  }
}

function WithPredictableIds({ children }: { children: any }) {
  const c = useRequestContext()
  c.set('bfInstanceIdGenerator', createPredictableIdGenerator())
  return <>{children}</>
}

// Import map for resolving @barefootjs/client in client JS.
// Compiler-emitted code imports from `@barefootjs/client/runtime`, which we
// point at the same runtime bundle (barefoot.js) served as /static/barefoot.js.
const importMapScript = JSON.stringify({
  imports: {
    '@barefootjs/client': '/static/barefoot.js',
    '@barefootjs/client/runtime': '/static/barefoot.js',
  },
})

export interface PreviewEntry {
  name: string
  displayName: string
}

export interface ServerOptions {
  /** Preview entries to render */
  previews: PreviewEntry[]
  /** Component name (for page title) */
  componentName: string
  /** Render function: given preview name, returns JSX */
  renderPreview: (name: string) => any
  /** Port number */
  port?: number
}

/**
 * Convert PascalCase to display title: "WithLabel" → "With Label"
 */
export function pascalToTitle(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export function createPreviewApp(options: ServerOptions) {
  const { previews, componentName, renderPreview } = options

  const app = new Hono()

  // Renderer: minimal HTML shell with import map, CSS, BfScripts
  app.use(
    '*',
    jsxRenderer(
      ({ children }) => {
        return (
          <WithPredictableIds>
            <html lang="en">
              <head>
                <script type="importmap" dangerouslySetInnerHTML={{ __html: importMapScript }} />
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>{componentName} — Preview</title>
                <link rel="stylesheet" href="/static/globals.css" />
                <link rel="stylesheet" href="/static/uno.css" />
                <style>{`
                  body {
                    padding: 2rem;
                    font-family: system-ui, -apple-system, sans-serif;
                  }
                  .preview-section {
                    margin-bottom: 2rem;
                    padding: 1.5rem;
                    border: 1px solid var(--border);
                    border-radius: var(--radius);
                  }
                  .preview-title {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--muted-foreground);
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  }
                  h1 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 1.5rem;
                  }
                  #bf-theme-toggle {
                    position: fixed;
                    bottom: 1rem;
                    right: 1rem;
                    z-index: 9999;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: var(--radius);
                    border: 1px solid var(--border);
                    background: var(--card);
                    color: var(--foreground);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,.1);
                  }
                  #bf-theme-toggle:hover {
                    background: var(--accent);
                  }
                  #bf-theme-toggle .sun { display: none }
                  #bf-theme-toggle .moon { display: block }
                  .dark #bf-theme-toggle .sun { display: block }
                  .dark #bf-theme-toggle .moon { display: none }
                `}</style>
              </head>
              <body>
                {children}
                <button
                  id="bf-theme-toggle"
                  type="button"
                  aria-label="Toggle dark mode"
                  onclick="var r=document.documentElement;r.classList.add('theme-transition');r.classList.toggle('dark');setTimeout(function(){r.classList.remove('theme-transition')},300)"
                >
                  <svg class="sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                  <svg class="moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </button>
                <BfPortals />
                <BfScripts />
              </body>
            </html>
          </WithPredictableIds>
        )
      },
      { stream: true }
    )
  )

  // Static files from .preview-dist/
  app.use('/static/*', serveStatic({
    root: '.preview-dist',
    rewriteRequestPath: (path) => path.replace('/static', ''),
  }))

  // Main route: render all previews
  app.get('/', (c) => {
    return c.render(
      <div>
        <h1>{componentName}</h1>
        {previews.map((preview) => (
          <div className="preview-section" data-preview={preview.name}>
            <div className="preview-title">{preview.displayName}</div>
            {renderPreview(preview.name)}
          </div>
        ))}
      </div>
    )
  })

  return app
}

export function startServer(app: ReturnType<typeof createPreviewApp>, port: number) {
  console.log(`\nPreview server running at http://localhost:${port}`)
  return Bun.serve({ port, fetch: app.fetch })
}
