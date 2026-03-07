"use client"

/**
 * Input Component
 *
 * A styled text input component following shadcn/ui design.
 * Accepts all native input attributes via ...props spread.
 *
 * @example Basic usage
 * ```tsx
 * <Input placeholder="Enter your name" />
 * ```
 *
 * @example With value binding
 * ```tsx
 * <Input value={name()} onInput={(e) => setName(e.target.value)} />
 * ```
 */

import type { InputHTMLAttributes } from '@barefootjs/jsx'

// Base classes (aligned with shadcn/ui)
const baseClasses = 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

// Focus state classes
const focusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// Error state classes
const errorClasses = 'aria-[invalid]:ring-destructive/20 dark:aria-[invalid]:ring-destructive/40 aria-[invalid]:border-destructive'

/**
 * Input component following shadcn/ui design.
 * Accepts all native input attributes.
 */
function Input({ className = '', type, ...props }: InputHTMLAttributes) {
  return (
    <input
      type={type}
      data-slot="input"
      className={`${baseClasses} ${focusClasses} ${errorClasses} ${className}`}
      {...props}
    />
  )
}

export { Input }
export type { InputHTMLAttributes as InputProps }
