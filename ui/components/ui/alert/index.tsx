"use client"

/**
 * Alert Components
 *
 * Displays a callout for important content with variant support.
 * Sub-components: Alert, AlertTitle, AlertDescription
 *
 * @see https://ui.shadcn.com/docs/components/alert
 */

import type { HTMLBaseAttributes } from '@barefootjs/jsx'
import type { Child } from '../../types'

type AlertVariant = 'default' | 'destructive'

const baseClasses = 'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current'

const variantClasses: Record<AlertVariant, string> = {
  default: 'bg-card text-card-foreground',
  destructive: 'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
}

const alertTitleClasses = 'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight'
const alertDescriptionClasses = 'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed'

interface AlertProps extends HTMLBaseAttributes {
  variant?: AlertVariant
  children?: Child
}

function Alert({ children, className = '', variant = 'default', ...props }: AlertProps) {
  return <div data-slot="alert" role="alert" className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>{children}</div>
}

interface AlertTitleProps extends HTMLBaseAttributes { children?: Child }
function AlertTitle({ children, className = '', ...props }: AlertTitleProps) {
  return <h5 data-slot="alert-title" className={`${alertTitleClasses} ${className}`} {...props}>{children}</h5>
}

interface AlertDescriptionProps extends HTMLBaseAttributes { children?: Child }
function AlertDescription({ children, className = '', ...props }: AlertDescriptionProps) {
  return <div data-slot="alert-description" className={`${alertDescriptionClasses} ${className}`} {...props}>{children}</div>
}

export { Alert, AlertTitle, AlertDescription }
export type { AlertVariant, AlertProps, AlertTitleProps, AlertDescriptionProps }
