import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const breadcrumbSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

describe('Breadcrumb', () => {
  const result = renderToTest(breadcrumbSource, 'breadcrumb.tsx', 'Breadcrumb')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is Breadcrumb', () => {
    expect(result.componentName).toBe('Breadcrumb')
  })

  test('no signals (stateless)', () => {
    expect(result.signals).toEqual([])
  })

  test('renders as nav with aria-label=breadcrumb', () => {
    expect(result.root.tag).toBe('nav')
    expect(result.root.aria['label']).toBe('breadcrumb')
  })

  test('has data-slot=breadcrumb', () => {
    expect(result.root.props['data-slot']).toBe('breadcrumb')
  })
})

describe('BreadcrumbList', () => {
  const result = renderToTest(breadcrumbSource, 'breadcrumb.tsx', 'BreadcrumbList')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is BreadcrumbList', () => {
    expect(result.componentName).toBe('BreadcrumbList')
  })

  test('renders as ol with data-slot=breadcrumb-list', () => {
    expect(result.root.tag).toBe('ol')
    expect(result.root.props['data-slot']).toBe('breadcrumb-list')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('flex-wrap')
  })
})

describe('BreadcrumbItem', () => {
  const result = renderToTest(breadcrumbSource, 'breadcrumb.tsx', 'BreadcrumbItem')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is BreadcrumbItem', () => {
    expect(result.componentName).toBe('BreadcrumbItem')
  })

  test('renders as li with data-slot=breadcrumb-item', () => {
    expect(result.root.tag).toBe('li')
    expect(result.root.props['data-slot']).toBe('breadcrumb-item')
  })
})

describe('BreadcrumbLink', () => {
  const result = renderToTest(breadcrumbSource, 'breadcrumb.tsx', 'BreadcrumbLink')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is BreadcrumbLink', () => {
    expect(result.componentName).toBe('BreadcrumbLink')
  })

  test('root is conditional (asChild branch)', () => {
    expect(result.root.type).toBe('conditional')
  })

  test('contains an anchor with data-slot=breadcrumb-link', () => {
    const link = result.find({ tag: 'a' })
    expect(link).not.toBeNull()
    expect(link!.props['data-slot']).toBe('breadcrumb-link')
  })
})

describe('BreadcrumbPage', () => {
  const result = renderToTest(breadcrumbSource, 'breadcrumb.tsx', 'BreadcrumbPage')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is BreadcrumbPage', () => {
    expect(result.componentName).toBe('BreadcrumbPage')
  })

  test('renders as span with aria-current=page', () => {
    expect(result.root.tag).toBe('span')
    expect(result.root.aria['current']).toBe('page')
  })

  test('has role=link and aria-disabled=true', () => {
    expect(result.root.role).toBe('link')
    expect(result.root.aria['disabled']).toBe('true')
  })

  test('has data-slot=breadcrumb-page', () => {
    expect(result.root.props['data-slot']).toBe('breadcrumb-page')
  })
})

describe('BreadcrumbSeparator', () => {
  const result = renderToTest(breadcrumbSource, 'breadcrumb.tsx', 'BreadcrumbSeparator')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is BreadcrumbSeparator', () => {
    expect(result.componentName).toBe('BreadcrumbSeparator')
  })

  test('renders as li with role=presentation', () => {
    expect(result.root.tag).toBe('li')
    expect(result.root.role).toBe('presentation')
  })

  test('has aria-hidden=true', () => {
    expect(result.root.aria['hidden']).toBe('true')
  })
})

describe('BreadcrumbEllipsis', () => {
  const result = renderToTest(breadcrumbSource, 'breadcrumb.tsx', 'BreadcrumbEllipsis')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is BreadcrumbEllipsis', () => {
    expect(result.componentName).toBe('BreadcrumbEllipsis')
  })

  test('renders as span with role=presentation', () => {
    expect(result.root.tag).toBe('span')
    expect(result.root.role).toBe('presentation')
  })

  test('has aria-hidden=true', () => {
    expect(result.root.aria['hidden']).toBe('true')
  })

  test('has data-slot=breadcrumb-ellipsis', () => {
    expect(result.root.props['data-slot']).toBe('breadcrumb-ellipsis')
  })

  test('contains sr-only "More" text for screen readers', () => {
    const srOnly = result.findAll({ tag: 'span' }).find((n) => n.classes.includes('sr-only'))
    expect(srOnly).not.toBeUndefined()
    expect(srOnly!.children.some((c) => c.text === 'More')).toBe(true)
  })
})
