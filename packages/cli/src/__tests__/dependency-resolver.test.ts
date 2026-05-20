import { describe, test, expect } from 'bun:test'
import { resolveDependenciesFromSource } from '../lib/dependency-resolver'
import path from 'path'

const repoRoot = path.resolve(import.meta.dir, '../../../..')
const srcComponentsDir = path.join(repoRoot, 'ui/components/ui')

describe('resolveDependenciesFromSource', () => {
  // Regression: `ui/meta/checkbox.json` once declared
  // `dependencies.internal: []` despite `checkbox/index.tsx` importing
  // `../icon`. `bf add checkbox` then shipped a project that failed to
  // bundle because `components/ui/icon/` was missing (#1435). Reading
  // source directly means the same drift cannot recur.
  test('checkbox → [checkbox, icon] (follows ../icon import in source)', () => {
    const result = resolveDependenciesFromSource(['checkbox'], srcComponentsDir)
    expect(result).toEqual(['checkbox', 'icon'])
  })

  test('button → [button, slot] (resolves internal dependency)', () => {
    const result = resolveDependenciesFromSource(['button'], srcComponentsDir)
    expect(result).toEqual(['button', 'slot'])
  })

  test('button + checkbox → [button, checkbox, icon, slot] (deduplication)', () => {
    const result = resolveDependenciesFromSource(['button', 'checkbox'], srcComponentsDir)
    expect(result).toEqual(['button', 'checkbox', 'icon', 'slot'])
  })

  test('returns sorted results regardless of input order', () => {
    const result = resolveDependenciesFromSource(['slot', 'button'], srcComponentsDir)
    expect(result).toEqual(['button', 'slot'])
  })

  test('skips unknown components gracefully', () => {
    const result = resolveDependenciesFromSource(['nonexistent'], srcComponentsDir)
    expect(result).toEqual(['nonexistent'])
  })

  test('handles empty input', () => {
    const result = resolveDependenciesFromSource([], srcComponentsDir)
    expect(result).toEqual([])
  })

  test('does not treat `./util` or `../../types` paths as sibling components', () => {
    // Only `../<name>` is a sibling component; `./X` is co-located and
    // `../../X` walks past the component root.
    const result = resolveDependenciesFromSource(['button'], srcComponentsDir)
    expect(result).not.toContain('types')
    expect(result).not.toContain('util')
  })
})
