"use client"

import type { ButtonHTMLAttributes } from '@barefootjs/jsx'
import { createSignal, createMemo } from '@barefootjs/dom'

/**
 * Toggle Component
 *
 * A two-state button that can be either on or off.
 * Supports both controlled and uncontrolled modes.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Uncontrolled (internal state)
 * ```tsx
 * <Toggle>Bold</Toggle>
 * <Toggle defaultPressed>Italic</Toggle>
 * ```
 *
 * @example Controlled (external state)
 * ```tsx
 * <Toggle pressed={isBold} onPressedChange={setIsBold}>Bold</Toggle>
 * ```
 *
 * @example With variant
 * ```tsx
 * <Toggle variant="outline">Outline</Toggle>
 * ```
 */

import type { Child } from '../../../types'

// Type definitions
type ToggleVariant = 'default' | 'outline'
type ToggleSize = 'default' | 'sm' | 'lg'

// Base classes matching shadcn/ui v4
const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-[invalid]:ring-destructive/20 dark:aria-[invalid]:ring-destructive/40 aria-[invalid]:border-destructive whitespace-nowrap data-[state=on]:bg-accent data-[state=on]:text-accent-foreground hover:bg-muted hover:text-muted-foreground'

// Variant-specific classes
const variantClasses: Record<ToggleVariant, string> = {
  default: 'bg-transparent',
  outline: 'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
}

// Size-specific classes
const sizeClasses: Record<ToggleSize, string> = {
  default: 'h-9 px-2 min-w-9',
  sm: 'h-8 px-1.5 min-w-8',
  lg: 'h-10 px-2.5 min-w-10',
}

/**
 * Props for the Toggle component.
 */
interface ToggleProps extends ButtonHTMLAttributes {
  /**
   * Default pressed state (for uncontrolled mode).
   * @default false
   */
  defaultPressed?: boolean
  /**
   * Controlled pressed state. When provided, component is in controlled mode.
   */
  pressed?: boolean
  /**
   * Visual variant of the toggle.
   * @default 'default'
   */
  variant?: ToggleVariant
  /**
   * Size of the toggle.
   * @default 'default'
   */
  size?: ToggleSize
  /**
   * Callback when the pressed state changes.
   */
  onPressedChange?: (pressed: boolean) => void
  /**
   * Children to render inside the toggle.
   */
  children?: Child
}

/**
 * Toggle component — a two-state button.
 * Supports both controlled and uncontrolled modes.
 *
 * @param props.defaultPressed - Initial value for uncontrolled mode
 * @param props.pressed - Controlled pressed state
 * @param props.disabled - Whether disabled
 * @param props.variant - Visual variant ('default' | 'outline')
 * @param props.size - Size ('default' | 'sm' | 'lg')
 * @param props.onPressedChange - Callback when pressed state changes
 */
function Toggle(props: ToggleProps) {
  // Internal state for uncontrolled mode
  const [internalPressed, setInternalPressed] = createSignal(props.defaultPressed ?? false)

  // Controlled state - synced from parent via DOM attribute
  const [controlledPressed, setControlledPressed] = createSignal<boolean | undefined>(props.pressed)

  // Track if component is in controlled mode (pressed prop provided)
  const isControlled = createMemo(() => props.pressed !== undefined)

  // Determine current pressed state: use controlled if provided, otherwise internal
  const isPressed = createMemo(() => isControlled() ? controlledPressed() : internalPressed())

  // Resolve variant and size
  const variant = props.variant ?? 'default'
  const size = props.size ?? 'default'

  // Classes
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${props.className ?? ''}`

  // Click handler that works for both controlled and uncontrolled modes
  const handleClick = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    const currentPressed = target.getAttribute('aria-pressed') === 'true'
    const newValue = !currentPressed

    // Update state based on mode
    if (isControlled()) {
      setControlledPressed(newValue)
    } else {
      setInternalPressed(newValue)
    }

    // Update the UI visually
    target.setAttribute('aria-pressed', String(newValue))
    target.setAttribute('data-state', newValue ? 'on' : 'off')

    // Notify parent if callback provided
    const scope = target.closest('[bf-s]')
    // @ts-ignore - onpressedChange is set by parent during hydration
    const scopeCallback = scope?.onpressedChange
    const handler = props.onPressedChange || scopeCallback
    handler?.(newValue)
  }

  return (
    <button
      data-slot="toggle"
      data-state={isPressed() ? 'on' : 'off'}
      id={props.id}
      aria-pressed={isPressed()}
      disabled={props.disabled ?? false}
      className={classes}
      onClick={handleClick}
    >
      {props.children}
    </button>
  )
}

export { Toggle }
export type { ToggleVariant, ToggleSize, ToggleProps }
