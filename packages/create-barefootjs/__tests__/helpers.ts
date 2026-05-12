// Test helpers for `create-barefootjs` — spawn the compiled bin in an
// isolated tmpdir, optionally rebuilding it on demand so tests don't
// depend on the run order with `bun run build`.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const PKG_DIR = path.resolve(here, '..')
export const CLI_PATH = path.resolve(PKG_DIR, 'dist', 'index.js')
export const SRC_PATH = path.resolve(PKG_DIR, 'src', 'index.ts')

export interface RunResult {
  exitCode: number | null
  stdout: string
  stderr: string
}

let built = false
export function ensureBuilt(): void {
  if (built) return
  const srcMtime = statSync(SRC_PATH).mtimeMs
  const distFresh = existsSync(CLI_PATH) && statSync(CLI_PATH).mtimeMs >= srcMtime
  if (!distFresh) {
    const res = spawnSync('bun', ['run', 'build'], {
      cwd: PKG_DIR,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (res.status !== 0) {
      throw new Error(`create-barefootjs build failed:\n${res.stdout}\n${res.stderr}`)
    }
  }
  built = true
}

export function mktmp(prefix = 'create-barefootjs-test-'): string {
  return mkdtempSync(path.join(tmpdir(), prefix))
}

export function runCreate(args: string[], opts: { cwd: string }): RunResult {
  ensureBuilt()
  const res = spawnSync('node', [CLI_PATH, ...args], {
    cwd: opts.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    // Make the child non-interactive — init's TTY-gated selectors fall
    // back to defaults when stdin isn't a TTY, which is exactly what we
    // want for deterministic tests.
    env: { ...process.env, CI: '1' },
  })
  return {
    exitCode: res.status,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
  }
}
