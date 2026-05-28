// Minimal static file server for `bf preview --serve` / `--watch`.
// Hand-rolled on node:http so the CLI gains no runtime dependency.

import { createServer, type Server } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.map': 'application/json; charset=utf-8',
}

export interface PreviewServer {
  url: string
  /** Signal connected browsers to reload (after a watch rebuild). */
  bumpReload(): void
  close(): void
}

export function startPreviewServer(distDir: string, port: number): PreviewServer {
  let reloadToken = String(Date.now())

  const server: Server = createServer((req, res) => {
    const url = (req.url ?? '/').split('?')[0]

    if (url === '/__preview_reload') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      res.end(reloadToken)
      return
    }

    // Resolve within distDir; reject path traversal.
    const rel = decodeURIComponent(url === '/' ? '/index.html' : url)
    const filePath = normalize(join(distDir, rel))
    if (!filePath.startsWith(distDir) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.statusCode = 404
      res.end('Not found')
      return
    }

    res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-store')
    createReadStream(filePath).pipe(res)
  })

  server.listen(port)

  return {
    url: `http://localhost:${port}`,
    bumpReload() {
      reloadToken = String(Date.now())
    },
    close() {
      server.close()
    },
  }
}
