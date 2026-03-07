"use client"

/**
 * RadioGroup Component
 *
 * A set of checkable buttons where only one can be checked at a time.
 * Supports both controlled and uncontrolled modes.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Uncontrolled (internal state)
 * ```tsx
 * <RadioGroup defaultValue="default">
 *   <RadioGroupItem value="default" />
 *   <RadioGroupItem value="comfortable" />
 *   <RadioGroupItem value="compact" />
 * </RadioGroup>
 * ```
 *
 * @example Controlled (external state)
 * ```tsx
 * <RadioGroup value={selected()} onValueChange={setSelected}>
 *   <RadioGroupItem value="option-1" />
 *   <RadioGroupItem value="option-2" />
 * </RadioGroup>
 * ```
 */

import type { HTMLBaseAttributes, ButtonHTMLAttributes } from '@barefootjs/jsx'
import { createContext, useContext, createSignal, createEffect, createMemo } from '@barefootjs/dom'
import type { Child } from '../../../types'

// Context for parent-child state sharing
interface RadioGroupContextValue {
  value: () => string
  onValueChange: (value: string) => void
  disabled: () => boolean
}

const RadioGroupContext = createContext<RadioGroupContextValue>()

// CSS classes for RadioGroupItem (module-level constants)
const itemBaseClasses = 'aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none'
const itemFocusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const itemStateClasses = '[&[data-state=unchecked]]:border-input [&[data-state=unchecked]]:text-primary dark:[&[data-state=unchecked]]:bg-input/30 [&[data-state=checked]]:border-primary [&[data-state=checked]]:text-primary'
const itemErrorClasses = 'aria-[invalid]:ring-destructive/20 dark:aria-[invalid]:ring-destructive/40 aria-[invalid]:border-destructive'
const itemDisabledClasses = 'disabled:cursor-not-allowed disabled:opacity-50'
const itemClasses = `${itemBaseClasses} ${itemFocusClasses} ${itemStateClasses} ${itemErrorClasses} ${itemDisabledClasses} grid place-content-center`

/**
 * Props for the RadioGroup component.
 */
interface RadioGroupProps extends HTMLBaseAttributes {
  /** Default selected value (for uncontrolled mode). */
  defaultValue?: string
  /** Controlled selected value. When provided, component is in controlled mode. */
  value?: string
  /** Callback when the selected value changes. */
  onValueChange?: (value: string) => void
  /** Whether the entire group is disabled. */
  disabled?: boolean
  /** RadioGroupItem children. */
  children?: Child
}

/**
 * RadioGroup component for single selection.
 * Manages value state and provides context to RadioGroupItem children.
 */
function RadioGroup(props: RadioGroupProps) {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = createSignal(props.defaultValue ?? '')

  // Controlled state
  const [controlledValue, setControlledValue] = createSignal<string | undefined>(props.value)

  // Track if component is in controlled mode
  const isControlled = createMemo(() => props.value !== undefined)

  // Determine current value
  const currentValue = createMemo(() => isControlled() ? (controlledValue() ?? '') : internalValue())

  return (
    <RadioGroupContext.Provider value={{
      value: currentValue,
      onValueChange: (newValue: string) => {
        if (isControlled()) {
          setControlledValue(newValue)
        } else {
          setInternalValue(newValue)
        }
        props.onValueChange?.(newValue)
      },
      disabled: () => props.disabled ?? false,
    }}>
      <div
        data-slot="radio-group"
        role="radiogroup"
        id={props.id}
        className={`grid gap-3 ${props.className ?? ''}`}
      >
        {props.children}
      </div>
    </RadioGroupContext.Provider>
  )
}

/**
 * Props for the RadioGroupItem component.
 */
interface RadioGroupItemProps extends ButtonHTMLAttributes {
  /** Value for this radio item. */
  value: string
  /** Whether this item is disabled. */
  disabled?: boolean
}

/**
 * RadioGroupItem component.
 * A single radio button within a RadioGroup.
 */
function RadioGroupItem(props: RadioGroupItemProps) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(RadioGroupContext)

    createEffect(() => {
      const isSelected = ctx.value() === props.value
      el.setAttribute('aria-checked', String(isSelected))
      el.setAttribute('data-state', isSelected ? 'checked' : 'unchecked')

      // Update indicator dot visibility
      const indicator = el.querySelector('[data-slot="radio-group-indicator"]') as HTMLElement
      if (indicator) {
        const circle = indicator.querySelector('circle')
        if (isSelected && !circle) {
          indicator.innerHTML = '<svg class="size-3.5 fill-primary" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /></svg>'
        } else if (!isSelected && circle) {
          indicator.innerHTML = ''
        }
      }
    })

    el.addEventListener('click', () => {
      if (el.hasAttribute('disabled') || ctx.disabled()) return
      ctx.onValueChange(props.value)
    })
  }

  return (
    <button
      data-slot="radio-group-item"
      data-state="unchecked"
      role="radio"
      aria-checked="false"
      disabled={props.disabled ?? false}
      id={props.id}
      className={`${itemClasses} ${props.className ?? ''}`}
      ref={handleMount}
    >
      <span data-slot="radio-group-indicator" className="flex items-center justify-center">
        {/* Dot indicator rendered reactively via effect */}
      </span>
    </button>
  )
}

export { RadioGroup, RadioGroupItem }
export type { RadioGroupProps, RadioGroupItemProps }
