import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import path from 'path'
import type { ComponentMeta } from '../lib/types'

// These tests verify the meta extraction output against known components.
// They read from ui/meta/ which must be regenerated with `bun run barefoot meta:extract`.

const metaDir = path.resolve(import.meta.dir, '../../../../ui/meta')

function loadMeta(name: string): ComponentMeta {
  return JSON.parse(readFileSync(path.join(metaDir, `${name}.json`), 'utf-8'))
}

describe('meta-extract integration: checkbox (stateful)', () => {
  const meta = loadMeta('checkbox')

  test('basic fields', () => {
    expect(meta.name).toBe('checkbox')
    expect(meta.stateful).toBe(true)
    expect(meta.category).toBe('input')
  })

  test('props extracted from Props interface', () => {
    expect(meta.props.length).toBeGreaterThan(0)
    const defaultChecked = meta.props.find(p => p.name === 'defaultChecked')
    expect(defaultChecked).toBeDefined()
    expect(defaultChecked!.type).toBe('boolean')
    expect(defaultChecked!.required).toBe(false)
    expect(defaultChecked!.default).toBe('false')
  })

  test('signals extracted from analyzer', () => {
    expect(meta.signals).toBeDefined()
    expect(meta.signals!.length).toBeGreaterThanOrEqual(2)
    const internalChecked = meta.signals!.find(s => s.getter === 'internalChecked')
    expect(internalChecked).toBeDefined()
    expect(internalChecked!.setter).toBe('setInternalChecked')
  })

  test('memos extracted from analyzer', () => {
    expect(meta.memos).toBeDefined()
    const isControlled = meta.memos!.find(m => m.name === 'isControlled')
    expect(isControlled).toBeDefined()
  })

  test('examples extracted from JSDoc', () => {
    expect(meta.examples.length).toBeGreaterThan(0)
    expect(meta.examples[0].title).toBeTruthy()
    expect(meta.examples[0].code).toBeTruthy()
  })

  test('accessibility extracted from source', () => {
    expect(meta.accessibility.role).toBe('checkbox')
    expect(meta.accessibility.ariaAttributes).toContain('aria-checked')
  })

  test('dependencies extracted from imports', () => {
    expect(meta.dependencies.external).toContain('@barefootjs/client')
  })
})

describe('meta-extract integration: button (stateless)', () => {
  const meta = loadMeta('button')

  test('basic fields', () => {
    expect(meta.name).toBe('button')
    expect(meta.stateful).toBe(false)
  })

  test('props include variant and size', () => {
    const variant = meta.props.find(p => p.name === 'variant')
    const size = meta.props.find(p => p.name === 'size')
    expect(variant).toBeDefined()
    expect(size).toBeDefined()
  })

  test('variants extracted', () => {
    expect(meta.variants).toBeDefined()
    expect(meta.variants!.ButtonVariant).toContain('default')
    expect(meta.variants!.ButtonVariant).toContain('destructive')
  })

  test('no signals/memos for stateless component', () => {
    expect(meta.signals).toBeUndefined()
    expect(meta.memos).toBeUndefined()
  })

  test('internal dependencies include slot', () => {
    expect(meta.dependencies.internal).toContain('slot')
  })
})

describe('meta-extract integration: accordion (multi-component)', () => {
  const meta = loadMeta('accordion')

  test('has sub-components', () => {
    expect(meta.subComponents).toBeDefined()
    expect(meta.subComponents!.length).toBeGreaterThanOrEqual(3)
    const itemNames = meta.subComponents!.map(s => s.name)
    expect(itemNames).toContain('AccordionItem')
    expect(itemNames).toContain('AccordionTrigger')
    expect(itemNames).toContain('AccordionContent')
  })

  test('sub-component has props', () => {
    const item = meta.subComponents!.find(s => s.name === 'AccordionItem')
    expect(item).toBeDefined()
    expect(item!.props.length).toBeGreaterThan(0)
    const valueProp = item!.props.find(p => p.name === 'value')
    expect(valueProp).toBeDefined()
    expect(valueProp!.required).toBe(true)
  })
})
