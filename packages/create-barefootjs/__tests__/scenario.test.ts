// Specification-as-test for `npm create barefootjs@latest <project-name>`.
//
// This file covers adapter-agnostic scenarios that don't require a live
// network connection: target-directory resolution, guards, and --help.
//
// Adapter-specific scaffold scenarios (happy-path output, dev-reload
// wiring, PM detection) live in each adapter package's `scaffold.test.ts`
// and are gated by BAREFOOT_CREATE_INTEGRATION=1.

import { describe, test, expect } from 'bun:test'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { mktmp, runCreate } from './helpers'

// ---------------------------------------------------------------------------
// Companion scenarios — alternative flows that don't follow the happy path.
// These run offline (no registry probe is reached).
// ---------------------------------------------------------------------------

describe('Scenario: how the target directory is chosen (no network)', () => {
  // Three branches the user can land in when invoking the CLI:
  //   (a) explicit positional arg → "Using target directory" confirmation
  //   (b) --yes / -y               → silent default acceptance
  //   (c) interactive prompt       → "Target directory: (my-app)"
  //                                  (TTY-gated; non-TTY falls back to default)

  describe('(a) When a positional argument is provided', () => {
    test('uses it verbatim and confirms with "✔ Target directory <name>"', () => {
      const cwd = mktmp()
      const r = runCreate(['demo-app'], { cwd })
      expect(r.stdout).toContain('✔ Target directory demo-app')
    })
  })

  describe('(b) When --yes / -y is passed without a positional argument', () => {
    test('skips the prompt and silently accepts "my-app"', () => {
      const cwd = mktmp()
      const r = runCreate(['--yes'], { cwd })
      expect(r.stdout).toContain('✔ Target directory my-app')
    })

    test('-y is accepted as an alias', () => {
      const cwd = mktmp()
      const r = runCreate(['-y'], { cwd })
      expect(r.stdout).toContain('✔ Target directory my-app')
    })
  })

  describe('(c) When neither a positional argument nor --yes is given', () => {
    test('falls back to "my-app" in non-TTY contexts (no hang)', () => {
      // The spawned child inherits a piped stdin (not a TTY), so the
      // text() helper short-circuits to the default instead of trying
      // to render a prompt. We only assert the create-barefootjs-side
      // contract (the default surfaces in the confirmation line);
      // whether the downstream `bf init` succeeds depends on
      // registry reachability and is covered by the integration suite.
      const cwd = mktmp()
      const r = runCreate([], { cwd })
      expect(r.stdout).toContain('✔ Target directory my-app')
    })
  })

  describe('(d) When the positional argument is a multi-segment path', () => {
    test('creates the nested directory tree and echoes the full path back', () => {
      const cwd = mktmp()
      const r = runCreate(['foo/bar/bazz'], { cwd })

      // Nested directory tree is created (create-barefootjs's own
      // responsibility, runs before init takes over).
      expect(existsSync(path.join(cwd, 'foo', 'bar', 'bazz'))).toBe(true)

      // Target-directory confirmation echoes the user's typed path,
      // not the basename. The `cd <full path>` line in Next steps is
      // asserted in the integration suite because it's printed by
      // init *after* the registry probe — offline runs may not reach
      // that step.
      expect(r.stdout).toContain('✔ Target directory foo/bar/bazz')
    })
  })

  describe('Guards applied to the resolved directory', () => {
    test('refuses to scaffold into an existing non-empty directory', () => {
      const cwd = mktmp()
      const projectDir = path.join(cwd, 'demo-app')
      mkdirSync(projectDir)
      writeFileSync(path.join(projectDir, 'README.md'), '# pre-existing')

      const r = runCreate(['demo-app'], { cwd })
      expect(r.exitCode).not.toBe(0)
      expect(r.stderr).toContain('exists and is not empty')
    })

    test('treats a dotfile-only directory (e.g. fresh `git init`) as empty', () => {
      const cwd = mktmp()
      const projectDir = path.join(cwd, 'demo-app')
      mkdirSync(projectDir)
      writeFileSync(path.join(projectDir, '.gitkeep'), '')

      const r = runCreate(['demo-app'], { cwd })
      expect(r.stderr).not.toContain('exists and is not empty')
      expect(r.stdout).toContain('✔ Target directory demo-app')
    })
  })
})

describe('Scenario: bun create barefootjs@latest --help', () => {
  test('--help prints usage and exits 0 without touching the filesystem', () => {
    const cwd = mktmp()
    const r = runCreate(['--help'], { cwd })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toContain('Usage:')
    expect(r.stdout).toContain('Scaffolds a runnable BarefootJS app')
    expect(r.stdout).toContain('--adapter')
    // Both top-level flags are documented.
    expect(r.stdout).toMatch(/-y, --yes/)
    expect(readdirSync(cwd)).toHaveLength(0)
  })

  test('-h is accepted as an alias for --help', () => {
    const r = runCreate(['-h'], { cwd: mktmp() })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toContain('Usage:')
  })
})
