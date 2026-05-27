import { describe, test, expect } from 'bun:test'
import { rewriteDestructuredPropsInExpr } from '../ir-to-client-js/emit-reactive'
import type { ClientJsContext } from '../ir-to-client-js/types'

function makeCtx(props: { name: string; defaultValue?: string }[]): ClientJsContext {
  return {
    propsParams: props.map(p => ({
      name: p.name,
      type: { raw: 'string' },
      optional: !!p.defaultValue,
      defaultValue: p.defaultValue,
    })),
    propsObjectName: null,
  } as unknown as ClientJsContext
}

describe('rewriteDestructuredPropsInExpr', () => {
  test('rewrites bare prop reference', () => {
    const ctx = makeCtx([{ name: 'size', defaultValue: "'default'" }])
    expect(rewriteDestructuredPropsInExpr('size', ctx))
      .toBe("(_p.size ?? 'default')")
  })

  test('rewrites prop inside interpolation of template literal', () => {
    const ctx = makeCtx([{ name: 'size', defaultValue: "'default'" }])
    const result = rewriteDestructuredPropsInExpr('`cls-${size}`', ctx)
    expect(result).toBe("`cls-${(_p.size ?? 'default')}`")
  })

  test('does NOT rewrite prop name inside double-quoted strings', () => {
    const ctx = makeCtx([{ name: 'size', defaultValue: "'default'" }])
    const result = rewriteDestructuredPropsInExpr('"size-9"', ctx)
    expect(result).toBe('"size-9"')
  })

  test('does NOT rewrite prop name inside single-quoted strings', () => {
    const ctx = makeCtx([{ name: 'size', defaultValue: "'default'" }])
    const result = rewriteDestructuredPropsInExpr("'size-9'", ctx)
    expect(result).toBe("'size-9'")
  })

  test('does NOT rewrite prop name in template literal static segment', () => {
    const ctx = makeCtx([{ name: 'size', defaultValue: "'default'" }])
    const expr = '`[&_svg:not([class*="size-"])]:size-4 ${size}`'
    const result = rewriteDestructuredPropsInExpr(expr, ctx)
    expect(result).toContain('[class*="size-"]')
    expect(result).toContain(':size-4')
    expect(result).toContain("(_p.size ?? 'default')")
  })

  test('does NOT rewrite prop name in object literal values inside template', () => {
    const ctx = makeCtx([{ name: 'size', defaultValue: "'default'" }])
    const expr = '`${({"icon": "size-9", "sm": "size-8"})[size]}`'
    const result = rewriteDestructuredPropsInExpr(expr, ctx)
    expect(result).toContain('"size-9"')
    expect(result).toContain('"size-8"')
    expect(result).toContain("(_p.size ?? 'default')")
  })

  test('rewrites prop without default value', () => {
    const ctx = makeCtx([{ name: 'variant' }])
    expect(rewriteDestructuredPropsInExpr('variant', ctx))
      .toBe('_p.variant')
  })

  test('skips children prop', () => {
    const ctx = makeCtx([{ name: 'children' }])
    expect(rewriteDestructuredPropsInExpr('children', ctx))
      .toBe('children')
  })

  test('skips when propsObjectName is set', () => {
    const ctx = makeCtx([{ name: 'size', defaultValue: "'default'" }])
    ;(ctx as any).propsObjectName = 'props'
    expect(rewriteDestructuredPropsInExpr('size', ctx))
      .toBe('size')
  })

  test('handles multiple props correctly', () => {
    const ctx = makeCtx([
      { name: 'variant', defaultValue: "'default'" },
      { name: 'size', defaultValue: "'default'" },
    ])
    const expr = '`${variantClasses[variant]} ${sizeClasses[size]}`'
    const result = rewriteDestructuredPropsInExpr(expr, ctx)
    expect(result).toContain("(_p.variant ?? 'default')")
    expect(result).toContain("(_p.size ?? 'default')")
  })

  test('Button className pattern: CSS selectors and variant maps preserved', () => {
    const ctx = makeCtx([
      { name: 'variant', defaultValue: "'default'" },
      { name: 'size', defaultValue: "'default'" },
      { name: 'className', defaultValue: "''" },
    ])
    const expr = '`inline-flex [&_svg:not([class*="size-"])]:size-4 ${({"default": "bg-primary", "outline": "border"})[variant]} ${({"default": "h-9", "icon": "size-9"})[size]} ${className}`'
    const result = rewriteDestructuredPropsInExpr(expr, ctx)
    expect(result).toContain('[class*="size-"]')
    expect(result).toContain(':size-4')
    expect(result).toContain('"size-9"')
    expect(result).toContain("(_p.variant ?? 'default')")
    expect(result).toContain("(_p.size ?? 'default')")
    expect(result).toContain("(_p.className ?? '')")
  })
})
