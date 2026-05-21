"use client"

/**
 * Slot Component
 *
 * A polymorphic component that merges its props with its child element.
 * Inspired by @radix-ui/react-slot. This enables the `asChild` pattern
 * used by components like Button and Badge.
 *
 * @example Basic usage
 * ```tsx
 * // Slot merges its props with the child element
 * <Slot className="custom-class" data-active="true">
 *   <a href="/home">Home</a>
 * </Slot>
 * // Renders: <a href="/home" className="custom-class" data-active="true">Home</a>
 * ```
 *
 * @example asChild pattern (used by Button, Badge, etc.)
 * ```tsx
 * // Button component internally uses Slot when asChild is true
 * <Button asChild>
 *   <a href="/home">Go Home</a>
 * </Button>
 * // Renders: <a href="/home" className="btn-classes...">Go Home</a>
 *
 * // Without asChild, renders a button element
 * <Button>Click me</Button>
 * // Renders: <button className="btn-classes...">Click me</button>
 * ```
 *
 * @example Class merging
 * ```tsx
 * // Classes from Slot and child are merged
 * <Slot className="slot-class">
 *   <div className="child-class">Content</div>
 * </Slot>
 * // Renders: <div className="slot-class child-class">Content</div>
 * ```
 */

import type { Child } from '../../../types'

/**
 * Props for the Slot component.
 */
interface SlotProps {
  /** Child element to merge props with */
  children?: Child
  /** CSS class to merge with child's class */
  className?: string
  /** Additional props to merge with child element */
  [key: string]: unknown
}

/**
 * Check if a value is a valid JSX element.
 * Hono's JSX elements have `tag` and `props` properties.
 */
function isValidElement(element: unknown): element is { tag: unknown; props: Record<string, unknown> } {
  return !!(element && typeof element === 'object' && 'tag' in element && 'props' in element)
}

/**
 * Slot component that renders its child with merged props.
 *
 * @param props.children - Child element to merge props with
 * @param props.className - CSS class to merge with child's class
 */
function Slot({ children, className, ...props }: SlotProps) {
  if (children && isValidElement(children)) {
    const Tag = children.tag as any
    // The `isValidElement` type guard narrows `children.props` to a
    // `Record<string, unknown>`, so the historical `|| {}` fallback
    // was dead code at runtime. Dropping it also keeps branch-local
    // inlining clean of object-literal nodes — the compiler's
    // `ParsedExpr` IR has no `array-literal` carve-out for `{}`, so
    // inlining `childClass` into the className-merge chain would
    // otherwise drag an unsupported shape into BF101 territory on
    // the Mojo / Go template adapters (#1443 follow-up).
    const childProps = children.props
    const childClass = (childProps.className as string) || ''
    const childChildren = childProps.children

    // Use JSX syntax - compiler will call jsx() from jsxImportSource
    const mergedClass = [className, childClass].filter(Boolean).join(' ')
    return <Tag {...childProps} {...props} className={mergedClass || undefined}>{childChildren}</Tag>
  }

  // Fallback: use Fragment to avoid DOM structure change
  return <>{children}</>
}

export { Slot }
export type { SlotProps }
