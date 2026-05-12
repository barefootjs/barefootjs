// Specification-as-test for `npm create barefootjs@latest <project-name>`.
//
// Read this file top-to-bottom to learn the full scaffold flow: each
// outer `describe` is one user-observable step, in the order it appears
// in stdout. The happy-path scenario is gated by an env flag because
// `barefoot init` probes the live UI registry over the network:
//
//   BAREFOOT_CREATE_INTEGRATION=1 bun test scenario.test.ts
//
// The companion scenarios at the bottom (target-dir guards, --help)
// don't reach the registry and always run.

import { describe, test, expect, beforeAll } from 'bun:test'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { mktmp, runCreate, type RunResult } from './helpers'

const INTEGRATION = process.env.BAREFOOT_CREATE_INTEGRATION === '1'

// ---------------------------------------------------------------------------
// Happy-path scenario — `bun create barefootjs@latest demo-app`
//
// Steps the user sees:
//   1. Resolve the target directory
//   2. Choose an adapter      (defaults to Hono, non-interactive)
//   3. Choose a CSS library   (defaults to UnoCSS, non-interactive)
//   4. Probe the BarefootJS UI registry
//   5. Write the runnable starter file set
//   6. Detect the package manager and print next-step instructions
// ---------------------------------------------------------------------------

describe.skipIf(!INTEGRATION)(
  'Scenario: bun create barefootjs@latest <project-name>',
  () => {
    let result: RunResult
    let projectDir: string
    let pkg: {
      name: string
      type: string
      scripts: Record<string, string>
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    beforeAll(() => {
      const cwd = mktmp()
      result = runCreate(['demo-app'], { cwd })
      projectDir = path.join(cwd, 'demo-app')
      pkg = JSON.parse(readFileSync(path.join(projectDir, 'package.json'), 'utf-8'))
    })

    describe('Step 1 — Resolve the target directory', () => {
      test('uses the positional argument as the project folder', () => {
        expect(existsSync(projectDir)).toBe(true)
      })

      test('announces the destination before doing any work', () => {
        expect(result.stdout).toMatch(/Scaffolding BarefootJS app in .*demo-app/)
      })
    })

    describe('Step 2 — Choose an adapter (Hono by default)', () => {
      test('non-interactive runs pick the registry default (Hono)', () => {
        expect(result.stdout).toMatch(/Adapter:\s+Hono/)
      })

      test('the chosen adapter is wired into package.json dependencies', () => {
        expect(pkg.dependencies['@barefootjs/hono']).toBeDefined()
        expect(pkg.dependencies['hono']).toBeDefined()
      })
    })

    describe('Step 3 — Choose a CSS library (UnoCSS by default)', () => {
      test('non-interactive runs pick the default CSS library (UnoCSS)', () => {
        expect(result.stdout).toMatch(/CSS library:\s+UnoCSS/)
      })

      test('UnoCSS config and generated stylesheet are present', () => {
        expect(pkg.devDependencies['unocss']).toBeDefined()
        expect(existsSync(path.join(projectDir, 'uno.config.ts'))).toBe(true)
        expect(existsSync(path.join(projectDir, 'public/uno.css'))).toBe(true)
      })
    })

    describe('Step 4 — Probe the BarefootJS UI registry', () => {
      test('does not bail with a registry-unreachable error', () => {
        // Registry probing is silent on success. We assert via the
        // contract that scaffolding proceeded past the probe.
        expect(result.stderr).not.toContain('cannot reach the BarefootJS UI registry')
        expect(result.stdout).toContain('Initializing BarefootJS app')
      })
    })

    describe('Step 5 — Write the runnable starter file set', () => {
      test.each([
        'server.tsx',
        'factory.ts',
        'renderer.tsx',
        'barefoot.config.ts',
        'tsconfig.json',
        'uno.config.ts',
        'components/Counter.tsx',
        'public/styles.css',
        'public/tokens.css',
        'public/uno.css',
        'dist/components/manifest.json',
        'meta/index.json',
        'package.json',
        'components/ui/button/index.tsx',
        'components/ui/slot/index.tsx',
        'types/index.tsx',
      ])('writes %s', (rel) => {
        expect(existsSync(path.join(projectDir, rel))).toBe(true)
      })

      test('package.json is named after the target directory', () => {
        expect(pkg.name).toBe('demo-app')
      })

      test('package.json exposes dev / build / start scripts', () => {
        expect(pkg.scripts.dev).toBeString()
        expect(pkg.scripts.build).toBeString()
        expect(pkg.scripts.start).toBeString()
      })
    })

    describe('Step 6 — Detect the package manager and print next steps', () => {
      test('auto-detects the package manager and announces it', () => {
        expect(result.stdout).toMatch(/detected package manager: (npm|pnpm|yarn|bun)/)
      })

      test('prints the install / dev next-step guide', () => {
        expect(result.stdout).toContain('Next steps:')
        expect(result.stdout).toMatch(/Install dependencies/)
        expect(result.stdout).toMatch(/Start the dev server/)
        expect(result.stdout).toMatch(/http:\/\/localhost:\d+/)
      })

      test('exits 0', () => {
        expect(result.exitCode).toBe(0)
      })
    })
  },
)

// ---------------------------------------------------------------------------
// Companion scenarios — alternative flows that don't follow the happy path.
// These run offline (no registry probe is reached).
// ---------------------------------------------------------------------------

describe('Scenario: target-directory guards (no network)', () => {
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
    expect(r.stdout).toContain('Scaffolding BarefootJS app in')
  })

  test('defaults the project folder name to "my-barefoot-app" when omitted', () => {
    const cwd = mktmp()
    const r = runCreate([], { cwd })
    expect(r.stdout).toMatch(/Scaffolding BarefootJS app in .*my-barefoot-app/)
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
    expect(readdirSync(cwd)).toHaveLength(0)
  })

  test('-h is accepted as an alias for --help', () => {
    const r = runCreate(['-h'], { cwd: mktmp() })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toContain('Usage:')
  })
})
