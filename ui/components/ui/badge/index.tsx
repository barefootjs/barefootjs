"use client"

/**
 * Badge Component
 *
 * A small status indicator component with multiple visual variants.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Badge>New</Badge>
 * ```
 *
 * @example With variant
 * ```tsx
 * <Badge variant="destructive">Error</Badge>
 * ```
 *
 * @example As a link (polymorphic rendering)
 * ```tsx
 * <Badge asChild>
 *   <a href="/status">Active</a>
 * </Badge>
 * ```
 */

import type { HTMLBaseAttributes } from '@barefootjs/jsx'
import type { Child } from '../../../types'
import { Slot } from '../slot'

// Type definitions for badge variants
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

// Base classes shared by all badges
const baseClasses = 'inline-flex items-center justify-center rounded-xl border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-[invalid]:ring-destructive/20 dark:aria-[invalid]:ring-destructive/40 aria-[invalid]:border-destructive transition-[color,box-shadow] overflow-hidden'

// Variant-specific classes
const variantClasses: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
  secondary: 'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
  destructive: 'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
  outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
}

/**
 * Props for the Badge component.
 */
interface BadgeProps extends HTMLBaseAttributes {
  /**
   * Visual style of the badge.
   * @default 'default'
   */
  variant?: BadgeVariant
  /**
   * When true, renders child element with badge styling instead of `<span>`.
   * Useful for creating badge-styled links or custom elements.
   * @default false
   */
  asChild?: boolean
  /**
   * Children to render inside the badge.
   */
  children?: Child
}

/**
 * Badge component with variants.
 *
 * @param props.variant - Visual style of the badge
 *   - `'default'` - Primary style, solid background
 *   - `'secondary'` - Muted styling for secondary indicators
 *   - `'destructive'` - Error or warning state (red)
 *   - `'outline'` - Bordered with transparent background
 * @param props.asChild - Render child element instead of span
 */
function Badge({
  className = '',
  variant = 'default',
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`

  if (asChild) {
    return <Slot className={classes} {...props}>{children}</Slot>
  }
  return <span data-slot="badge" className={classes} {...props}>{children}</span>
}

export { Badge }
export type { BadgeVariant, BadgeProps }
