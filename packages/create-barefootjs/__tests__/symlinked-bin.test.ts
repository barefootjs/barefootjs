// Regression test for the entrypoint-guard symlink bug.
//
// `npm install` materialises every `bin` entry as a symlink under
// `node_modules/.bin/`. Node sets `process.argv[1]` to the symlink path
// the user launched with, while `import.meta.url` always resolves the
// underlying file. The auto-run gate in src/index.ts compares the two
// to decide whether to run `main()` — without `realpathSync` on both
// sides, the comparison fails for every real install and the scaffold
// silently does nothing (exit 0, no output, no files).
//
// We reproduce that install shape here by symlinking `dist/index.js`
// to a sibling path and invoking the symlink. A working build runs
// main() and emits the banner; a regressed build exits 0 silently.

import { describe, test, expect } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { CLI_PATH, ensureBuilt } from './helpers'

describe('create-barefootjs binary launched via a symlink', () => {
  test('still runs main() (npm-style `node_modules/.bin/<bin>` install path)', () => {
    ensureBuilt()
    const workdir = mkdtempSync(path.join(tmpdir(), 'create-barefootjs-symlink-'))
    const linkPath = path.join(workdir, 'create-barefootjs-link')
    symlinkSync(CLI_PATH, linkPath)

    const cwd = mkdtempSync(path.join(tmpdir(), 'create-barefootjs-symlink-cwd-'))
    // Touch a sentinel so the scaffolded "my-app" guard kicks in
    // *only* if main() actually executed past the version banner —
    // the test asserts on the banner directly below for the positive
    // signal, this is just to avoid the spawn touching the network.
    writeFileSync(path.join(cwd, '.placeholder'), '')

    const result = spawnSync('node', [linkPath, '--help'], {
      cwd,
      encoding: 'utf-8',
      env: { ...process.env, CI: '1' },
    })

    expect(result.status).toBe(0)
    // The banner / usage block is the unambiguous "main() ran" signal.
    expect(result.stdout).toContain('Usage:')
    expect(result.stdout).toContain('Scaffolds a runnable BarefootJS app')
  })
})
