#!/usr/bin/env bun
/**
 * Dev-all proxy: expose every adapter under a single origin.
 *
 *   localhost:4000/                            → landing page
 *   localhost:4000/examples/hono/*             → localhost:3001 (wrangler dev)
 *   localhost:4000/examples/echo/*             → localhost:8080 (go run .)
 *   localhost:4000/examples/mojolicious/*      → localhost:3004 (perl app.pl)
 *
 * Each adapter already mounts its routes under /examples/<name>, so this
 * script just dispatches by path prefix and forwards the request verbatim.
 * SSE and streaming responses work because Bun.serve returns the upstream
 * Response directly without buffering.
 */

const PORT = Number(process.env.DEV_ALL_PORT ?? 4000)

type Route = {
  prefix: string
  target: string
  label: string
}

const routes: readonly Route[] = [
  { prefix: '/examples/hono',        target: 'http://localhost:3001', label: 'Hono (Workers)' },
  { prefix: '/examples/echo',        target: 'http://localhost:8080', label: 'Echo (Go)' },
  { prefix: '/examples/mojolicious', target: 'http://localhost:3004', label: 'Mojolicious (Perl)' },
] as const

function matchRoute(pathname: string): Route | null {
  for (const route of routes) {
    if (pathname === route.prefix || pathname.startsWith(route.prefix + '/')) {
      return route
    }
  }
  return null
}

function landingHtml(): string {
  const items = routes
    .map(r => `    <li><a href="${r.prefix}/">${r.label}</a> <code>${new URL(r.target).host}</code></li>`)
    .join('\n')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BarefootJS dev — all adapters</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1rem; color: #1f2937; }
    h1 { margin-bottom: 0.25rem; }
    p { color: #6b7280; margin-top: 0; }
    ul { list-style: none; padding: 0; }
    li { margin: 0.75rem 0; font-size: 1.1rem; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 3px; font-size: 0.85em; color: #374151; margin-left: 0.5rem; }
  </style>
</head>
<body>
  <h1>BarefootJS dev</h1>
  <p>All adapters proxied from a single origin.</p>
  <ul>
${items}
  </ul>
</body>
</html>
`
}

Bun.serve({
  port: PORT,
  async fetch(req): Promise<Response> {
    const url = new URL(req.url)

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(landingHtml(), {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      })
    }

    const route = matchRoute(url.pathname)
    if (!route) {
      return new Response(`No route matches ${url.pathname}. See /.`, {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      })
    }

    const proxyUrl = route.target + url.pathname + url.search
    try {
      return await fetch(proxyUrl, {
        method: req.method,
        headers: req.headers,
        body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
        redirect: 'manual',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(
        `Upstream ${route.target} unreachable (${msg}). Is the adapter's dev server running?`,
        { status: 502, headers: { 'Content-Type': 'text/plain' } },
      )
    }
  },
})

console.log(`dev-all proxy listening on http://localhost:${PORT}`)
console.log(`  /                          → landing page`)
for (const r of routes) {
  console.log(`  ${r.prefix.padEnd(26)} → ${r.target}`)
}
