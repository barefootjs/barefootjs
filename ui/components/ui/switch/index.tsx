"use client"

import type { ButtonHTMLAttributes } from '@barefootjs/jsx'
import { createSignal, createMemo } from '@barefootjs/dom'

/**
 * Switch Component
 *
 * A toggle switch for boolean state.
 * Supports both controlled and uncontrolled modes.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Uncontrolled (internal state)
 * ```tsx
 * <Switch />
 * <Switch defaultChecked />
 * ```
 *
 * @example Controlled (external state)
 * ```tsx
 * <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
 * ```
 *
 * @example Disabled state
 * ```tsx
 * <Switch checked disabled />
 * ```
 */

// Base classes for the switch track (h-5 w-9 matches shadcn/ui dimensions)
const trackBaseClasses = 'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent p-0 shadow-xs transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50'

// Focus visible classes
const trackFocusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// State classes using data-state attribute selectors for reactivity
const trackStateClasses = [
  '[&[data-state=unchecked]]:bg-input',
  'dark:[&[data-state=unchecked]]:bg-input/80',
  '[&[data-state=checked]]:bg-primary',
].join(' ')

// Thumb base classes
const thumbBaseClasses = 'pointer-events-none block size-4 rounded-full bg-background ring-0 transition-transform dark:[&[data-state=unchecked]]:bg-foreground dark:[&[data-state=checked]]:bg-primary-foreground'

// Thumb state classes using data-state attribute selectors
const thumbStateClasses = [
  '[&[data-state=unchecked]]:translate-x-0',
  '[&[data-state=checked]]:translate-x-[calc(100%-2px)]',
].join(' ')

/**
 * Props for the Switch component.
 */
interface SwitchProps extends ButtonHTMLAttributes {
  /**
   * Default checked state (for uncontrolled mode).
   * @default false
   */
  defaultChecked?: boolean
  /**
   * Controlled checked state. When provided, component is in controlled mode.
   */
  checked?: boolean
  /**
   * Callback when the switch is toggled.
   */
  onCheckedChange?: (checked: boolean) => void
}

/**
 * Switch component for toggling boolean state.
 * Supports both controlled and uncontrolled modes.
 *
 * @param props.defaultChecked - Initial value for uncontrolled mode
 * @param props.checked - Controlled checked state
 * @param props.disabled - Whether disabled
 * @param props.onCheckedChange - Callback when toggled
 */
function Switch(props: SwitchProps) {
  // Internal state for uncontrolled mode
  const [internalChecked, setInternalChecked] = createSignal(props.defaultChecked ?? false)

  // Controlled state - synced from parent via DOM attribute
  const [controlledChecked, setControlledChecked] = createSignal<boolean | undefined>(props.checked)

  // Track if component is in controlled mode (checked prop provided)
  const isControlled = createMemo(() => props.checked !== undefined)

  // Determine current checked state: use controlled if provided, otherwise internal
  const isChecked = createMemo(() => isControlled() ? controlledChecked() : internalChecked())

  // Helper function to update switch UI (visual state)
  const updateSwitchUI = (track: HTMLElement, newValue: boolean) => {
    const state = newValue ? 'checked' : 'unchecked'

    // Update track ARIA and data attributes
    track.setAttribute('aria-checked', String(newValue))
    track.setAttribute('data-state', state)

    // Update thumb data-state
    const thumb = track.querySelector('[data-slot="switch-thumb"]')
    if (thumb) {
      thumb.setAttribute('data-state', state)
    }
  }

  // Classes - state styling handled by data-state attribute selectors
  const trackClasses = `${trackBaseClasses} ${trackFocusClasses} ${trackStateClasses} ${props.className ?? ''}`

  const thumbClasses = `${thumbBaseClasses} ${thumbStateClasses}`

  // Click handler that works for both controlled and uncontrolled modes
  const handleClick = (e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    const currentChecked = target.getAttribute('aria-checked') === 'true'
    const newValue = !currentChecked

    // Update state based on mode
    if (isControlled()) {
      setControlledChecked(newValue)
    } else {
      setInternalChecked(newValue)
    }

    // Update the UI visually
    updateSwitchUI(target, newValue)

    // Notify parent if callback provided
    // Check scope element for callback (parent sets callback there during hydration)
    const scope = target.closest('[bf-s]')
    // @ts-ignore - oncheckedChange is set by parent during hydration
    const scopeCallback = scope?.oncheckedChange
    const handler = props.onCheckedChange || scopeCallback
    handler?.(newValue)
  }

  return (
    <button
      data-slot="switch"
      data-state={isChecked() ? 'checked' : 'unchecked'}
      role="switch"
      id={props.id}
      aria-checked={isChecked()}
      disabled={props.disabled ?? false}
      className={trackClasses}
      onClick={handleClick}
    >
      <span data-slot="switch-thumb" data-state={isChecked() ? 'checked' : 'unchecked'} className={thumbClasses} />
    </button>
  )
}

export { Switch }
export type { SwitchProps }
