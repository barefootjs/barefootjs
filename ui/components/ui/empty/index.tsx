"use client"

/**
 * Empty State Components
 *
 * A placeholder component for empty states with icon, title, description,
 * and action slots. Sub-components: Empty, EmptyHeader, EmptyMedia,
 * EmptyTitle, EmptyDescription, EmptyContent
 *
 * @see https://ui.shadcn.com/docs/components/empty
 */

import type { HTMLBaseAttributes } from '@barefootjs/jsx'
import type { Child } from '../../../types'

// --- EmptyMedia variant ---

type EmptyMediaVariant = 'default' | 'icon'

const emptyMediaBaseClasses = 'mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0'

const emptyMediaVariantClasses: Record<EmptyMediaVariant, string> = {
  default: 'bg-transparent',
  icon: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg:not([class*='size-'])]:size-6",
}

// --- CSS class constants ---

const emptyClasses = 'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12'
const emptyHeaderClasses = 'flex max-w-sm flex-col items-center gap-2 text-center'
const emptyTitleClasses = 'text-lg font-medium tracking-tight'
const emptyDescriptionClasses = 'text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary'
const emptyContentClasses = 'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance'

// --- Component interfaces ---

interface EmptyProps extends HTMLBaseAttributes {
  children?: Child
}

interface EmptyHeaderProps extends HTMLBaseAttributes {
  children?: Child
}

interface EmptyMediaProps extends HTMLBaseAttributes {
  /** @default 'default' */
  variant?: EmptyMediaVariant
  children?: Child
}

interface EmptyTitleProps extends HTMLBaseAttributes {
  children?: Child
}

interface EmptyDescriptionProps extends HTMLBaseAttributes {
  children?: Child
}

interface EmptyContentProps extends HTMLBaseAttributes {
  children?: Child
}

// --- Components ---

function Empty({ children, className = '', ...props }: EmptyProps) {
  return <div data-slot="empty" className={`${emptyClasses} ${className}`} {...props}>{children}</div>
}

function EmptyHeader({ children, className = '', ...props }: EmptyHeaderProps) {
  return <div data-slot="empty-header" className={`${emptyHeaderClasses} ${className}`} {...props}>{children}</div>
}

function EmptyMedia({ children, className = '', variant = 'default', ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={`${emptyMediaBaseClasses} ${emptyMediaVariantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

function EmptyTitle({ children, className = '', ...props }: EmptyTitleProps) {
  return <div data-slot="empty-title" className={`${emptyTitleClasses} ${className}`} {...props}>{children}</div>
}

function EmptyDescription({ children, className = '', ...props }: EmptyDescriptionProps) {
  return <div data-slot="empty-description" className={`${emptyDescriptionClasses} ${className}`} {...props}>{children}</div>
}

function EmptyContent({ children, className = '', ...props }: EmptyContentProps) {
  return <div data-slot="empty-content" className={`${emptyContentClasses} ${className}`} {...props}>{children}</div>
}

export { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent }
export type { EmptyMediaVariant, EmptyProps, EmptyHeaderProps, EmptyMediaProps, EmptyTitleProps, EmptyDescriptionProps, EmptyContentProps }
