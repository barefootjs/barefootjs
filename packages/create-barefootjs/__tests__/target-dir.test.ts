// Target-directory guard behavior. create-barefootjs decides whether the
// destination is usable BEFORE spawning `barefoot init`, so these tests
// can assert the gatekeeper without requiring network or a live registry.

import { describe, test, expect } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { mktmp, runCreate } from './helpers'

describe('target directory handling', () => {
  test('refuses to scaffold into an existing non-empty directory', () => {
    const cwd = mktmp()
    const target = path.join(cwd, 'my-app')
    mkdirSync(target)
    writeFileSync(path.join(target, 'README.md'), '# pre-existing')

    const r = runCreate(['my-app'], { cwd })
    expect(r.exitCode).not.toBe(0)
    expect(r.stderr).toContain('exists and is not empty')
  })

  test('treats a dotfile-only directory as empty (passes the gate)', () => {
    // A dir containing only dotfiles (e.g. a fresh `git init`) should be
    // usable. We don't drive the scaffold all the way through here —
    // registry probing happens downstream — but we DO assert that the
    // create-barefootjs gate let the run proceed past its own check.
    const cwd = mktmp()
    const target = path.join(cwd, 'my-app')
    mkdirSync(target)
    writeFileSync(path.join(target, '.gitkeep'), '')

    const r = runCreate(['my-app'], { cwd })
    expect(r.stderr).not.toContain('exists and is not empty')
    // Banner only prints once we reach the init spawn step.
    expect(r.stdout).toContain('Scaffolding BarefootJS app in')
  })
})
