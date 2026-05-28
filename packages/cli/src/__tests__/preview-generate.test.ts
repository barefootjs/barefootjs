import { describe, test, expect } from 'bun:test'
import { generatePreview } from '../lib/preview-generate'
import type { ComponentMeta } from '../lib/types'

function makeMeta(overrides: Partial<ComponentMeta>): ComponentMeta {
  return {
    name: 'test',
    title: 'Test',
    description: '',
    props: [],
    examples: [],
    tags: [],
    stateful: false,
    ...overrides,
  } as ComponentMeta
}

describe('generatePreview', () => {
  test('multi-root JSX is wrapped in Fragment', () => {
    const meta = makeMeta({
      name: 'typography',
      title: 'Typography',
      subComponents: [
        { name: 'TypographyH2', description: '', props: [] },
      ],
      tags: ['multi-component'],
      examples: [{
        title: 'Headings',
        code: '<TypographyH1>H1</TypographyH1>\n<TypographyH2>H2</TypographyH2>',
      }],
    })
    const result = generatePreview(meta)
    expect(result.code).toContain('<>')
    expect(result.code).toContain('</>')
  })

  test('single-root multi-line JSX is NOT wrapped in Fragment', () => {
    const meta = makeMeta({
      name: 'input-group',
      title: 'Input Group',
      subComponents: [
        { name: 'InputGroupAddon', description: '', props: [] },
        { name: 'InputGroupInput', description: '', props: [] },
      ],
      tags: ['multi-component'],
      examples: [{
        title: 'Basic',
        code: '<InputGroup>\n  <InputGroupAddon>prefix</InputGroupAddon>\n  <InputGroupInput placeholder="..." />\n</InputGroup>',
      }],
    })
    const result = generatePreview(meta)
    expect(result.code).not.toContain('<>')
  })

  test('XxxIcon tags import from ../icon', () => {
    const meta = makeMeta({
      name: 'input-group',
      title: 'Input Group',
      subComponents: [
        { name: 'InputGroupInput', description: '', props: [] },
      ],
      tags: ['multi-component'],
      examples: [{
        title: 'With icon',
        code: '<InputGroup>\n  <SearchIcon />\n  <InputGroupInput />\n</InputGroup>',
      }],
    })
    const result = generatePreview(meta)
    expect(result.code).toContain("from '../icon'")
    expect(result.code).not.toContain("from '../search-icon'")
  })

  test('tags sharing parent prefix import from parent module', () => {
    const meta = makeMeta({
      name: 'typography',
      title: 'Typography',
      subComponents: [
        { name: 'TypographyH2', description: '', props: [] },
      ],
      tags: ['multi-component'],
      examples: [{
        title: 'Headings',
        code: '<TypographyH1>H1</TypographyH1>\n<TypographyH2>H2</TypographyH2>',
      }],
    })
    const result = generatePreview(meta)
    expect(result.code).toContain("TypographyH1 } from '../typography'")
    expect(result.code).not.toContain("from '../typography-h1'")
  })

  test('unused root component is not imported for multi-component with examples', () => {
    const meta = makeMeta({
      name: 'typography',
      title: 'Typography',
      subComponents: [
        { name: 'TypographyH2', description: '', props: [] },
      ],
      tags: ['multi-component'],
      examples: [{
        title: 'Headings',
        code: '<TypographyH1>H1</TypographyH1>\n<TypographyH2>H2</TypographyH2>',
      }],
    })
    const result = generatePreview(meta)
    // "Typography" (root) is not used in the example, should not appear
    expect(result.code).not.toMatch(/\bTypography,/)
    expect(result.code).not.toMatch(/\{ Typography }/)
  })
})
