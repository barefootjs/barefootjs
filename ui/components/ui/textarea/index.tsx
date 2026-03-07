"use client"

/**
 * Textarea Component
 *
 * A styled multi-line text input component with error state support.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic usage
 * ```tsx
 * <Textarea placeholder="Type your message here." />
 * ```
 *
 * @example With value binding
 * ```tsx
 * <Textarea value={message()} onInput={(e) => setMessage(e.target.value)} />
 * ```
 *
 * @example With error state
 * ```tsx
 * <Textarea error describedBy="error-message" />
 * ```
 */

import type { TextareaHTMLAttributes } from '@barefootjs/jsx'

// Base classes (aligned with shadcn/ui)
const baseClasses = 'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

// Focus state classes
const focusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// Error state classes
const errorClasses = 'aria-[invalid]:ring-destructive/20 dark:aria-[invalid]:ring-destructive/40 aria-[invalid]:border-destructive'

/**
 * Props for the Textarea component.
 */
interface TextareaProps extends TextareaHTMLAttributes {
  /**
   * Whether the textarea is in an error state.
   * @default false
   */
  error?: boolean
  /**
   * ID of the element that describes this textarea (for accessibility).
   */
  describedBy?: string
}

/**
 * Textarea component with error state support.
 *
 * @param props.placeholder - Placeholder text
 * @param props.value - Current value
 * @param props.disabled - Whether disabled
 * @param props.readOnly - Whether read-only
 * @param props.error - Whether in error state
 * @param props.describedBy - ID of describing element for accessibility
 * @param props.rows - Number of visible text rows
 */
function Textarea({
  className = '',
  placeholder = '',
  value = '',
  disabled = false,
  readonly = false,
  error = false,
  describedBy,
  rows,
  onInput = () => {},
  onChange = () => {},
  onBlur = () => {},
  onFocus = () => {},
  ...props
}: TextareaProps) {
  const classes = `${baseClasses} ${focusClasses} ${errorClasses} ${className}`

  return (
    <textarea
      data-slot="textarea"
      className={classes}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      readonly={readonly}
      rows={rows}
      aria-invalid={error || undefined}
      {...(describedBy ? { 'aria-describedby': describedBy } : {})}
      onInput={onInput}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      {...props}
    />
  )
}

export { Textarea }
export type { TextareaProps }
