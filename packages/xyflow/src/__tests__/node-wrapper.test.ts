import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToTest } from '@barefootjs/test'

// IR-level test for the JSX-native NodeWrapper (#1081 step 6). Verifies the
// per-node `<div>` shape: reactive class string, transform-based position,
// `data-id`, and the children slot.
const source = readFileSync(resolve(__dirname, '../components/node-wrapper.tsx'), 'utf-8')

describe('NodeWrapper JSX shape (#1081 step 6)', () => {
  const result = renderToTest(source, 'node-wrapper.tsx', 'NodeWrapper')

  test('JSX → IR pipeline reports no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('component is recognized as a client component', () => {
    expect(result.isClient).toBe(true)
  })

  test('declares the position/class/style memos', () => {
    // node memo wraps both positionEpoch and nodes() reads — the same
    // dual-tracking the imperative wrapper uses (positionEpoch for
    // in-flight drag, nodes() for structural commits).
    expect(result.memos).toContain('node')
    expect(result.memos).toContain('transform')
    expect(result.memos).toContain('zIndex')
    expect(result.memos).toContain('className')
    expect(result.memos).toContain('style')
  })

  test('renders a single wrapper <div>', () => {
    const divs = result.findAll({ tag: 'div' })
    expect(divs.length).toBe(1)
  })

  test('wrapper exposes data-id and reactive className', () => {
    const div = result.find({ tag: 'div' })!
    expect(div.props['data-id']).toBe('props.nodeId')
    expect(div.classes).toContain('className()')
  })
})
