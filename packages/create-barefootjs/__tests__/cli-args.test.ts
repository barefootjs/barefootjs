// CLI argument handling for create-barefootjs. These tests exercise
// behavior that resolves BEFORE the bin spawns `barefoot init`, so they
// run offline.

import { describe, test, expect } from 'bun:test'
import { mktmp, runCreate } from './helpers'

describe('--help / -h', () => {
  test('prints usage and exits 0', () => {
    const r = runCreate(['--help'], { cwd: mktmp() })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toContain('Usage:')
    expect(r.stdout).toContain('Scaffolds a runnable BarefootJS app')
    expect(r.stdout).toContain('--adapter')
  })

  test('-h is accepted as an alias', () => {
    const r = runCreate(['-h'], { cwd: mktmp() })
    expect(r.exitCode).toBe(0)
    expect(r.stdout).toContain('Usage:')
  })

  test('--help short-circuits before touching the filesystem', () => {
    // No project dir should be created when help is requested.
    const cwd = mktmp()
    const r = runCreate(['--help'], { cwd })
    expect(r.exitCode).toBe(0)
    const { readdirSync } = require('node:fs') as typeof import('node:fs')
    expect(readdirSync(cwd)).toHaveLength(0)
  })
})
