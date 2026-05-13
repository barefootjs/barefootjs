// Echo (Go) adapter starter.
//
// Scaffolds a runnable Echo + Go html/template app with the BarefootJS
// runtime vendored under `./bf-runtime` (a `replace` directive in
// `go.mod` keeps imports stable). The runtime sources are inlined into
// the CLI bundle by `scripts/embed-runtimes.mjs` so the scaffold is
// self-contained — no network fetch, no monorepo path leaks.
//
// File layout, by ownership:
//   - `main.go` — application: middleware, routes, server start. The
//     user's day-to-day workspace.
//   - `renderer.go` — user-customizable `defaultLayout` (the Go
//     equivalent of Hono's `renderer.tsx`).
//   - `bf_render.go` — generated boilerplate (template loader + echo
//     renderer adapter). Marked DO NOT EDIT; init seeds it once.

import { execSync } from 'node:child_process'
import type { AdapterTemplate } from '../templates'
import {
  SHARED_COUNTER_TSX,
  STYLES_CSS,
  TOKENS_CSS,
  UNOCSS_DEV_DEPENDENCIES,
  UNO_CSS_PLACEHOLDER,
  unoConfigTs,
} from './shared'
import {
  bfGoSource,
  streamingGoSource,
} from './runtimes.generated'

// We don't ship the upstream `bf-runtime/go.mod` as-is — it pins the
// Go version to whatever the monorepo developer happens to be on
// (currently 1.25). Override with a permissive `go 1.22` floor so the
// scaffold runs on any reasonably current Go install.
const ECHO_BF_RUNTIME_GO_MOD = `module github.com/barefootjs/runtime/bf

go 1.22
`

const ECHO_BAREFOOT_CONFIG_TS = `import { createConfig } from '@barefootjs/go-template/build'

export default createConfig({
  paths: {
    components: 'components/ui',
    tokens: 'tokens',
    meta: 'meta',
  },
  components: ['components'],
  outDir: 'dist',
  adapterOptions: {
    packageName: 'main',
    clientJsBasePath: '/static/components/',
    barefootJsPath: '/static/components/barefoot.js',
  },
  // Generated Go struct types for every component, written next to main.go.
  // Overwritten on every \`barefoot build\` run.
  typesOutputFile: 'components.go',
})
`

// Application entry: just middleware, routes, and the server. The
// render plumbing (template loading, echo adapter, layout function)
// lives in sibling files so users see only their own concerns here.
const ECHO_MAIN_GO = `package main

import (
\t"fmt"
\t"net/http"
\t"os"

\tbf "github.com/barefootjs/runtime/bf"
\t"github.com/labstack/echo/v4"
\t"github.com/labstack/echo/v4/middleware"
)

func main() {
\te := echo.New()
\te.Use(middleware.Logger())
\te.Use(middleware.Recover())

\t// Auto-reload SSE — mounts /_bf/reload when BAREFOOT_DEV=1 and is
\t// a no-op pass-through otherwise. Pairs with the snippet
\t// renderer.go's defaultLayout drops into <body>.
\te.Use(DevReloadMiddleware())

\t// Render plumbing lives in bf_render.go. Edit defaultLayout in
\t// renderer.go to change the surrounding HTML.
\te.Renderer = mustNewRenderer()

\t// The go-template adapter emits client bundles under dist/client/
\t// and templates reference them at /static/components/ (per the
\t// barefoot.config.ts \`clientJsBasePath\`). Bridge URL → disk.
\te.Static("/static/components", "dist/client")
\te.Static("/static", "public")

\te.GET("/", func(c echo.Context) error {
\t\t// \`NewCounterProps\` / \`CounterInput\` are generated into
\t\t// components.go by \`barefoot build\` — they wire up scope IDs,
\t\t// child-slot props, and signal initial values. Use them
\t\t// instead of constructing props by hand.
\t\tprops := NewCounterProps(CounterInput{Initial: 0})
\t\treturn c.Render(http.StatusOK, "Counter", bf.RenderOptions{
\t\t\tTitle: "BarefootJS app",
\t\t\tProps: &props,
\t\t})
\t})

\tport := os.Getenv("PORT")
\tif port == "" {
\t\tport = "3001"
\t}
\tfmt.Printf("  ➜ http://localhost:%s\\n", port)
\te.Logger.Fatal(e.Start(":" + port))
}
`

// User-customizable layout: the Go equivalent of \`renderer.tsx\` for
// Hono. Adjust the surrounding HTML, swap in additional <link> /
// <script> tags, etc. The render context carries the
// component-rendered HTML, the page title, the script collector
// output, and any portals.
const ECHO_RENDERER_GO = `package main

import (
\t"fmt"

\tbf "github.com/barefootjs/runtime/bf"
)

// defaultLayout is the wrapping HTML the BarefootJS render pipeline
// hands every component. Edit freely — this file is yours.
func defaultLayout(ctx *bf.RenderContext) string {
\treturn fmt.Sprintf(\`<!DOCTYPE html>
<html lang="en">
<head>
\t<meta charset="utf-8" />
\t<meta name="viewport" content="width=device-width, initial-scale=1.0" />
\t<title>%s</title>
\t<!-- Link all three sheets so the browser fetches them in parallel —
\t     chaining via styles.css @import would defer tokens/uno to a
\t     second round-trip and flash unstyled DOM. tokens first so its
\t     CSS variables are defined before any rule references them. -->
\t<link rel="stylesheet" href="/static/tokens.css" />
\t<link rel="stylesheet" href="/static/styles.css" />
\t<link rel="stylesheet" href="/static/uno.css" />
</head>
<body>
\t<main>%s</main>
\t%s
\t%s
\t%s
</body>
</html>\`,
\t\tctx.Title,
\t\tctx.ComponentHTML,
\t\tctx.Portals,
\t\tctx.Scripts,
\t\t// DevReloadScript returns "" in production so this stays empty.
\t\tDevReloadScript(),
\t)
}
`

// Auto-generated render glue. Tied closely to BarefootJS internals;
// seeded by \`barefoot init\` and intentionally not refreshed on
// re-runs (init's scaffold loop skips files that already exist on
// disk, so manual edits survive). To pick up an upstream
// boilerplate change, delete this file and re-run \`barefoot init\`,
// or apply the diff by hand. Editing is supported but not
// expected — most app concerns belong in main.go (routes,
// middleware) or renderer.go (layout HTML).
const ECHO_BF_RENDER_GO = `package main

// Code generated by BarefootJS for the Echo adapter. DO NOT EDIT.
// To refresh, delete this file and re-run \`barefoot init\` from a
// fresh directory — \`barefoot init\` skips existing files, so it
// won't clobber your edits in place.

import (
\t"crypto/rand"
\t"encoding/hex"
\t"fmt"
\t"html/template"
\t"io"
\t"io/fs"
\t"net/http"
\t"os"
\t"path/filepath"
\t"time"

\tbf "github.com/barefootjs/runtime/bf"
\t"github.com/labstack/echo/v4"
)

// loadTemplates walks dist/templates/ recursively and parses every
// .tmpl file. ParseGlob("dist/templates/*.tmpl") only catches the
// top-level directory, missing per-component subdirectories like
// dist/templates/ui/button/index.tmpl that Counter invokes via
// {{template "Button" ...}}.
//
// Also registers a no-op "Tag" template so html/template's escape
// pass (which validates references in unreachable branches too)
// doesn't crash the first call to any template that transitively
// includes Slot — the go-template adapter emits a
// \`{{template "Tag" ...}}\` reference inside Slot that's only
// reachable when AsChild=true.
//
// TODO: drop the stub once @barefootjs/go-template emits a real
// "Tag" template alongside Slot (tracked upstream — when it lands,
// re-running \`barefoot init\` after deleting this file pulls the
// updated boilerplate).
func loadTemplates() (*template.Template, error) {
\troot := template.New("").Funcs(bf.FuncMap())
\tif _, err := root.New("Tag").Parse(""); err != nil {
\t\treturn nil, err
\t}
\terr := filepath.WalkDir("dist/templates", func(path string, d fs.DirEntry, err error) error {
\t\tif err != nil {
\t\t\treturn err
\t\t}
\t\tif d.IsDir() || filepath.Ext(path) != ".tmpl" {
\t\t\treturn nil
\t\t}
\t\t_, parseErr := root.ParseFiles(path)
\t\treturn parseErr
\t})
\treturn root, err
}

// echoRenderer adapts bf.Renderer to echo.Renderer.
//
// In dev mode (BAREFOOT_DEV=1) it re-parses dist/templates/ on every
// Render call so a \`barefoot build --watch\` update surfaces as soon
// as the browser refreshes — no Go server restart needed. In
// production the parse happens once at startup.
type echoRenderer struct {
\tbf      *bf.Renderer
\tdevMode bool
}

func (r *echoRenderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
\tif r.devMode {
\t\ttmpl, err := loadTemplates()
\t\tif err != nil {
\t\t\treturn err
\t\t}
\t\tr.bf = bf.NewRenderer(tmpl, defaultLayout)
\t}
\topts := data.(bf.RenderOptions)
\topts.ComponentName = name
\t_, err := w.Write([]byte(r.bf.Render(opts)))
\treturn err
}

// mustNewRenderer wires up template loading + the layout function
// that lives in renderer.go. On template parse failure we surface
// the cause to stderr and exit non-zero, so the cause shows up
// before the Go panic stack trace clutters the screen.
func mustNewRenderer() echo.Renderer {
\ttmpl, err := loadTemplates()
\tif err != nil {
\t\tfmt.Fprintf(os.Stderr, "barefoot: failed to load templates from dist/templates: %v\\n", err)
\t\tfmt.Fprintln(os.Stderr, "barefoot: did you run \`bun run build\` first?")
\t\tos.Exit(1)
\t}
\treturn &echoRenderer{
\t\tbf:      bf.NewRenderer(tmpl, defaultLayout),
\t\tdevMode: os.Getenv("BAREFOOT_DEV") == "1",
\t}
}

// ── dev auto-reload ──────────────────────────────────────────────────
//
// SSE handler + browser snippet that mirror @barefootjs/hono/app's
// barefootDevReload middleware. Each Go process generates a fresh
// bootID at startup, so when \`barefoot build --watch\` triggers a
// rebuild and you re-run \`bun run dev\`, the EventSource the browser
// has open sees a Last-Event-ID that no longer matches and fires a
// reload. Disabled (404 + empty snippet) when BAREFOOT_DEV != "1".
//
// In the current dev script BAREFOOT_DEV=1 is set but Go itself
// doesn't restart automatically — \`barefoot build --watch\` only
// regenerates dist/templates and the renderer above re-parses them
// per request, so the page DOES need a manual nudge. This snippet
// supplies that nudge by riding on the SSE handler defined here
// (long-poll style heartbeat keeps the connection open; a code
// change that bounces the Go process rotates bootID, the browser
// reconnects with the old id, and the handler answers
// \`event: reload\`).

var bootID = func() string {
\tvar b [16]byte
\tif _, err := rand.Read(b[:]); err != nil {
\t\treturn fmt.Sprintf("%d", time.Now().UnixNano())
\t}
\treturn hex.EncodeToString(b[:])
}()

// DevReloadMiddleware mounts the SSE endpoint at "/_bf/reload" when
// BAREFOOT_DEV=1, otherwise it's a no-op pass-through. Add via
// \`e.Use(DevReloadMiddleware())\` in main.go.
func DevReloadMiddleware() echo.MiddlewareFunc {
\tif os.Getenv("BAREFOOT_DEV") != "1" {
\t\treturn func(next echo.HandlerFunc) echo.HandlerFunc { return next }
\t}
\treturn func(next echo.HandlerFunc) echo.HandlerFunc {
\t\treturn func(c echo.Context) error {
\t\t\tif c.Request().Method == http.MethodGet && c.Request().URL.Path == "/_bf/reload" {
\t\t\t\treturn handleDevReload(c)
\t\t\t}
\t\t\treturn next(c)
\t\t}
\t}
}

func handleDevReload(c echo.Context) error {
\tlastEventID := c.Request().Header.Get("Last-Event-ID")
\tres := c.Response()
\tres.Header().Set("Content-Type", "text/event-stream")
\tres.Header().Set("Cache-Control", "no-cache")
\tres.Header().Set("Connection", "keep-alive")
\tres.WriteHeader(http.StatusOK)

\tfmt.Fprint(res.Writer, "retry: 1000\\n\\n")
\tevent := "hello"
\tif lastEventID != "" && lastEventID != bootID {
\t\tevent = "reload"
\t}
\tfmt.Fprintf(res.Writer, "event: %s\\nid: %s\\ndata: %s\\n\\n", event, bootID, bootID)
\tres.Flush()

\tctx := c.Request().Context()
\tticker := time.NewTicker(5 * time.Second)
\tdefer ticker.Stop()
\tfor {
\t\tselect {
\t\tcase <-ctx.Done():
\t\t\treturn nil
\t\tcase <-ticker.C:
\t\t\tif _, err := fmt.Fprint(res.Writer, ": hb\\n\\n"); err != nil {
\t\t\t\treturn nil
\t\t\t}
\t\t\tres.Flush()
\t\t}
\t}
}

// DevReloadScript returns the inline <script> tag that subscribes
// to the SSE endpoint above and refreshes the page on \`reload\`,
// preserving scroll position across the round-trip. Returns "" in
// production so nothing extra ends up in deployed HTML.
func DevReloadScript() string {
\tif os.Getenv("BAREFOOT_DEV") != "1" {
\t\treturn ""
\t}
\treturn \`<script>(()=>{if(window.__bfDevReload)return;window.__bfDevReload=1;try{var s=sessionStorage.getItem('__bf_devreload_scroll');if(s){sessionStorage.removeItem('__bf_devreload_scroll');var y=parseInt(s,10);if(!isNaN(y)){var restore=function(){window.scrollTo(0,y)};if(document.readyState==='loading'){addEventListener('DOMContentLoaded',restore,{once:true})}else{restore()}}}}catch(e){}var es=new EventSource('/_bf/reload');es.addEventListener('reload',function(){try{sessionStorage.setItem('__bf_devreload_scroll',String(window.scrollY))}catch(e){}es.close();location.reload()});es.addEventListener('error',function(){})})();</script>\`
}
`

const ECHO_GO_MOD = `module barefoot-app

go 1.22

require (
\tgithub.com/barefootjs/runtime/bf v0.0.0
\tgithub.com/labstack/echo/v4 v4.12.0
)

// The BarefootJS Go runtime ships vendored under ./bf-runtime so this
// scaffold runs without depending on a published Go module.
replace github.com/barefootjs/runtime/bf => ./bf-runtime
`

const ECHO_TSCONFIG = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@barefootjs/jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["./components/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", "bf-runtime"]
}
`

export const ECHO_ADAPTER: AdapterTemplate = {
  label: 'Echo (Go, html/template SSR)',
  port: 3001,
  files: {
    'main.go': ECHO_MAIN_GO,
    'renderer.go': ECHO_RENDERER_GO,
    'bf_render.go': ECHO_BF_RENDER_GO,
    'go.mod': ECHO_GO_MOD,
    'bf-runtime/bf.go': bfGoSource,
    'bf-runtime/streaming.go': streamingGoSource,
    'bf-runtime/go.mod': ECHO_BF_RUNTIME_GO_MOD,
    'barefoot.config.ts': ECHO_BAREFOOT_CONFIG_TS,
    'tsconfig.json': ECHO_TSCONFIG,
    'uno.config.ts': unoConfigTs([
      'components/**/*.tsx',
      'dist/components/**/*.tsx',
    ]),
    'components/Counter.tsx': SHARED_COUNTER_TSX,
    'public/styles.css': STYLES_CSS,
    'public/tokens.css': TOKENS_CSS,
    'public/uno.css': UNO_CSS_PLACEHOLDER,
  },
  scripts: {
    // `go mod tidy` resolves Echo's deps into go.sum on first run —
    // subsequent runs are a fast no-op against the module cache. After
    // that, build everything once (barefoot generates components.go +
    // dist/templates/*.tmpl, unocss generates uno.css), then run the
    // watchers and the Go server side-by-side. `concurrently -k` makes
    // Ctrl-C kill all three. Go has no built-in hot reload — restart
    // manually after main.go edits, or swap in `air` later.
    // BAREFOOT_DEV=1 flips the Go renderer into re-parse-per-request
    // mode so component edits surface on the next browser refresh
    // without a Go server restart.
    dev: 'go mod tidy && barefoot build && unocss && concurrently -k -n build,uno,server -c blue,magenta,green "barefoot build --watch" "unocss --watch" "BAREFOOT_DEV=1 go run ."',
    build: 'go mod tidy && barefoot build && unocss',
    start: 'go run .',
  },
  dependencies: {
    '@barefootjs/cli': 'latest',
    '@barefootjs/client': 'latest',
    '@barefootjs/go-template': 'latest',
    '@barefootjs/jsx': 'latest',
    '@barefootjs/shared': 'latest',
  },
  devDependencies: {
    ...UNOCSS_DEV_DEPENDENCIES,
    concurrently: '^9.0.0',
    typescript: '^5.6.0',
  },
  prereqWarnings: () => goPrereqs(),
}

function goPrereqs(): string[] {
  try {
    execSync('go version', { stdio: 'ignore' })
    return []
  } catch {
    return [
      'Go toolchain not found on PATH. Install Go 1.22+ (https://go.dev/dl/) before `bun run dev`.',
    ]
  }
}
