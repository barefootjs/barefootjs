"use client"

/**
 * Card Components
 *
 * A flexible container component with composable sub-components.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * @example Basic card with header and content
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description here</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here.</p>
 *   </CardContent>
 * </Card>
 * ```
 *
 * @example Card with footer
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Confirm Action</CardTitle>
 *   </CardHeader>
 *   <CardContent>Are you sure?</CardContent>
 *   <CardFooter>
 *     <Button variant="outline">Cancel</Button>
 *     <Button>Confirm</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */

import type { HTMLBaseAttributes, ImgHTMLAttributes } from '@barefootjs/jsx'
import type { Child } from '../../../types'

// Card classes (has-data-[slot=card-image] removes top padding when image is present)
// Card classes (group/card for hover state detection)
const cardClasses = 'group/card bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm has-data-[slot=card-image]:pt-0 has-data-[slot=card-image]:overflow-hidden'

// CardImage classes (aspect-video for consistent height)
const cardImageClasses = 'w-full aspect-video object-cover'

// CardHeader classes (Grid for CardAction support)
const cardHeaderClasses = '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6'

// CardTitle classes
const cardTitleClasses = 'text-lg font-semibold leading-tight tracking-tight'

// CardDescription classes
const cardDescriptionClasses = 'text-sm text-muted-foreground'

// CardContent classes
const cardContentClasses = 'px-6'

// CardAction classes (aligned with CardTitle row)
const cardActionClasses = 'col-start-2 row-span-1 row-start-1 self-center justify-self-end'

// CardFooter classes
const cardFooterClasses = 'flex items-center px-6 [.border-t]:pt-6'

/**
 * Props for Card component.
 */
interface CardProps extends HTMLBaseAttributes {
  /** Card content (typically CardHeader, CardContent, CardFooter) */
  children?: Child
}

/**
 * Card container component.
 *
 * @param props.children - Card sub-components
 * @param props.className - Additional CSS classes
 */
function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div data-slot="card" className={`${cardClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Props for CardHeader component.
 */
interface CardHeaderProps extends HTMLBaseAttributes {
  /** Header content (typically CardTitle and CardDescription) */
  children?: Child
}

/**
 * Card header section.
 *
 * @param props.children - Header content
 */
function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div data-slot="card-header" className={`${cardHeaderClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Props for CardTitle component.
 */
interface CardTitleProps extends HTMLBaseAttributes {
  /** Title text */
  children?: Child
}

/**
 * Card title text.
 *
 * @param props.children - Title content
 */
function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3 data-slot="card-title" className={`${cardTitleClasses} ${className}`} {...props}>
      {children}
    </h3>
  )
}

/**
 * Props for CardDescription component.
 */
interface CardDescriptionProps extends HTMLBaseAttributes {
  /** Description text */
  children?: Child
}

/**
 * Card description text.
 *
 * @param props.children - Description content
 */
function CardDescription({ children, className = '', ...props }: CardDescriptionProps) {
  return (
    <p data-slot="card-description" className={`${cardDescriptionClasses} ${className}`} {...props}>
      {children}
    </p>
  )
}

/**
 * Props for CardContent component.
 */
interface CardContentProps extends HTMLBaseAttributes {
  /** Main content */
  children?: Child
}

/**
 * Card main content area.
 *
 * @param props.children - Main content
 */
function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div data-slot="card-content" className={`${cardContentClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Props for CardImage component.
 */
interface CardImageProps extends ImgHTMLAttributes {
  /** Image source URL */
  src: string
  /** Alternative text for the image */
  alt: string
}

/**
 * Card image displayed at the top of the card.
 *
 * @param props.src - Image source URL
 * @param props.alt - Alternative text
 * @param props.width - Image width
 * @param props.height - Image height
 */
function CardImage({ src, alt, width, height, className = '', ...props }: CardImageProps) {
  return (
    <img
      data-slot="card-image"
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`${cardImageClasses} ${className}`}
      {...props}
    />
  )
}

/**
 * Props for CardAction component.
 */
interface CardActionProps extends HTMLBaseAttributes {
  /** Action content (typically buttons) */
  children?: Child
}

/**
 * Card action button area in the header.
 *
 * @param props.children - Action content
 */
function CardAction({ children, className = '', ...props }: CardActionProps) {
  return (
    <div data-slot="card-action" className={`${cardActionClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Props for CardFooter component.
 */
interface CardFooterProps extends HTMLBaseAttributes {
  /** Footer content (typically action buttons) */
  children?: Child
}

/**
 * Card footer section.
 *
 * @param props.children - Footer content
 */
function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div data-slot="card-footer" className={`${cardFooterClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

export { Card, CardImage, CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter }
export type { CardProps, CardImageProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardActionProps, CardFooterProps }
