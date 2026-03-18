'use client'

/**
 * Pagination Component
 *
 * Navigation component for paginated content.
 * Built with accessible nav, list, and link elements.
 *
 * @example
 * ```tsx
 * <Pagination>
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationPrevious href="#" />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="#" isActive>1</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="#">2</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationEllipsis />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationNext href="#" />
 *     </PaginationItem>
 *   </PaginationContent>
 * </Pagination>
 * ```
 */

import type { AnchorHTMLAttributes, HTMLBaseAttributes } from '@barefootjs/jsx'
import type { Child } from '../../../types'
import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon } from '../icon'

// Button variant/size classes (from button.tsx)
const buttonBaseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

const variantClasses = {
  outline: 'border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50',
  ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
}

const sizeClasses = {
  default: 'h-9 px-4 py-2 has-[>svg]:px-3',
  icon: 'size-9',
}

interface PaginationProps extends HTMLBaseAttributes {
  children?: Child
}

function Pagination({ className = '', children, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={`mx-auto flex w-full justify-center ${className}`}
      {...props}
    >
      {children}
    </nav>
  )
}

interface PaginationContentProps extends HTMLBaseAttributes {
  children?: Child
}

function PaginationContent({ className = '', children, ...props }: PaginationContentProps) {
  return (
    <ul
      data-slot="pagination-content"
      className={`flex flex-row items-center gap-1 ${className}`}
      {...props}
    >
      {children}
    </ul>
  )
}

interface PaginationItemProps extends HTMLBaseAttributes {
  children?: Child
}

function PaginationItem({ className = '', children, ...props }: PaginationItemProps) {
  return <li data-slot="pagination-item" className={className} {...props}>{children}</li>
}

interface PaginationLinkProps extends AnchorHTMLAttributes {
  isActive?: boolean
  size?: 'default' | 'icon'
  children?: Child
}

function PaginationLink(props: PaginationLinkProps) {
  const size = props.size ?? 'icon'
  return (
    <a
      aria-current={props.isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={props.isActive}
      id={props.id}
      className={`${buttonBaseClasses} ${props.isActive ? variantClasses.outline : variantClasses.ghost} ${sizeClasses[size]} ${props.className ?? ''}`}
      href={props.href}
      onClick={props.onClick}
    >
      {props.children}
    </a>
  )
}

interface PaginationPrevNextProps extends AnchorHTMLAttributes {
  children?: Child
}

function PaginationPrevious({ className = '', children, ...props }: PaginationPrevNextProps) {
  return (
    <a
      aria-label="Go to previous page"
      data-slot="pagination-link"
      className={`${buttonBaseClasses} ${variantClasses.ghost} ${sizeClasses.default} gap-1 px-2.5 sm:pl-2.5 ${className}`}
      {...props}
    >
      <ChevronLeftIcon size="sm" />
      <span className="hidden sm:block">Previous</span>
    </a>
  )
}

function PaginationNext({ className = '', children, ...props }: PaginationPrevNextProps) {
  return (
    <a
      aria-label="Go to next page"
      data-slot="pagination-link"
      className={`${buttonBaseClasses} ${variantClasses.ghost} ${sizeClasses.default} gap-1 px-2.5 sm:pr-2.5 ${className}`}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon size="sm" />
    </a>
  )
}

interface PaginationEllipsisProps extends HTMLBaseAttributes {
}

function PaginationEllipsis({ className = '', ...props }: PaginationEllipsisProps) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={`flex size-9 items-center justify-center ${className}`}
      {...props}
    >
      <EllipsisIcon size="sm" />
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
export type { PaginationLinkProps }
