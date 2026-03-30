/**
 * Shared Documentation Components (Dark Mode)
 *
 * Reusable components for documentation pages.
 * Uses CSS variables for theming support.
 */

import { TableOfContents, type TocItem } from '@/components/table-of-contents'
import { CopyButton } from '@/components/copy-button'
// Re-export PackageManagerTabs from compiled component
export { PackageManagerTabs } from '@/components/package-manager-tabs'
import { PageNavigation } from '../../../shared/components/page-navigation'
import { getNavLinks } from './PageNavigation'
import { highlight } from './highlighter'
import { PageNav } from '../../../shared/components/page-nav'

// Re-export TocItem for convenience
export type { TocItem }

// Documentation page wrapper with TOC sidebar and footer navigation
export interface DocPageProps {
  slug: string
  toc: TocItem[]
  children: any
}

export function DocPage({ slug, toc, children }: DocPageProps) {
  const navLinks = getNavLinks(slug)

  return (
    <div className="flex gap-16">
      <div className="flex-1 min-w-0">
        {children}
        <PageNavigation {...navLinks} />
      </div>
      <TableOfContents items={toc} />
    </div>
  )
}

// Page header with title, description, and optional navigation
export interface PageHeaderProps {
  title: string
  description: string
  prev?: { href: string; title: string }
  next?: { href: string; title: string }
}

export function PageHeader({ title, description, prev, next }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">{title}</h1>
        <PageNav prev={prev} next={next} />
      </div>
      <p className="text-muted-foreground text-lg leading-relaxed">{description}</p>
    </div>
  )
}

// Preview component wrapper with subtle dot pattern background
export function Preview({ children }: { children: any }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-8 border rounded-lg bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted)/0.5)_1px,transparent_1px)] bg-[length:16px_16px] pointer-events-none" />
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
        {children}
      </div>
    </div>
  )
}

// Code block component with syntax highlighting, line numbers, and copy button
export function CodeBlock({
  code,
  lang = 'tsx',
  showLineNumbers = true,
}: {
  code: string
  lang?: string
  showLineNumbers?: boolean
}) {
  const highlightedCode = highlight(code, lang)
  const lines = highlightedCode.split('\n')
  // Remove trailing empty line if present
  if (lines[lines.length - 1] === '') {
    lines.pop()
  }

  return (
    <div className="relative group">
      <pre className="p-4 pr-12 bg-muted rounded-lg overflow-x-auto text-sm font-mono">
        <code className="block">
          {showLineNumbers ? (
            lines.map((line, i) => (
              <span key={i} className="table-row">
                <span className="table-cell pr-4 text-right select-none text-muted-foreground/50 w-8">
                  {i + 1}
                </span>
                <span className="table-cell" dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
              </span>
            ))
          ) : (
            <span dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          )}
        </code>
      </pre>
      <CopyButton code={code} />
    </div>
  )
}

// Section component with scroll margin for anchor links
export function Section({ id, title, children }: { id?: string; title: string; children: any }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-16">
      <h2 className="text-xl font-semibold tracking-tight text-foreground group relative">
        {id && (
          <a
            href={`#${id}`}
            className="absolute -left-5 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity no-underline"
            aria-label={`Link to ${title}`}
          >
            #
          </a>
        )}
        {title}
      </h2>
      {children}
    </section>
  )
}

// Subsection component
export function Subsection({ title, children }: { title: string; children: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {children}
    </div>
  )
}

// Props table types
export interface PropDefinition {
  name: string
  type: string
  defaultValue?: string
  description: string
}

// Props table row
function PropRow({ name, type, defaultValue, description }: PropDefinition) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-3 px-4 font-mono text-sm text-foreground whitespace-nowrap">{name}</td>
      <td className="py-3 px-4 font-mono text-sm text-muted-foreground whitespace-nowrap">{type}</td>
      <td className="py-3 px-4 font-mono text-sm text-muted-foreground whitespace-nowrap">{defaultValue || '-'}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">{description}</td>
    </tr>
  )
}

// Props table component with horizontal scroll for mobile
export function PropsTable({ props }: { props: PropDefinition[] }) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-muted">
          <tr className="border-b">
            <th className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">Prop</th>
            <th className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">Type</th>
            <th className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">Default</th>
            <th className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map(prop => (
            <PropRow key={prop.name} {...prop} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Convert title to kebab-case id
function toKebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-')
}

// Example component with preview and code in a unified container
export function Example({
  title,
  code,
  children,
  showLineNumbers: showLineNumbersProp,
}: {
  title?: string
  code: string
  children: any
  showLineNumbers?: boolean
}) {
  // Highlight code and split into lines for line number display
  const highlightedCode = highlight(code, 'tsx')
  const lines = highlightedCode.split('\n')
  // Remove trailing empty line if present
  if (lines[lines.length - 1] === '') {
    lines.pop()
  }

  // Default to showing line numbers, can be explicitly disabled
  const showLineNumbers = showLineNumbersProp ?? true

  const id = title ? toKebabCase(title) : undefined

  return (
    <div className="space-y-4">
      {title && (
        <h3 id={id} className="text-lg font-medium text-foreground scroll-mt-20 group relative">
          {id && (
            <a
              href={`#${id}`}
              className="absolute -left-5 text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity no-underline"
              aria-label={`Link to ${title}`}
            >
              #
            </a>
          )}
          {title}
        </h3>
      )}
      <div className="border border-solid rounded-lg overflow-hidden">
        {/* Preview section */}
        <div className="flex flex-wrap items-center justify-center gap-4 px-8 py-32 bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted)/0.5)_1px,transparent_1px)] bg-[length:16px_16px] pointer-events-none" />
          <div className="relative z-10 w-full flex flex-wrap items-center justify-center gap-4">
            {children}
          </div>
        </div>
        {/* Code section with conditional line numbers */}
        <div className="relative group">
          <pre className="m-0 p-4 pr-12 bg-muted overflow-x-auto text-sm font-mono">
            <code className="block">
              {showLineNumbers ? (
                lines.map((line, i) => (
                  <span key={i} className="table-row">
                    <span className="table-cell pr-4 text-right select-none text-muted-foreground/50 w-8">
                      {i + 1}
                    </span>
                    <span className="table-cell" dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                  </span>
                ))
              ) : (
                <span dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              )}
            </code>
          </pre>
          <CopyButton code={code} />
        </div>
      </div>
    </div>
  )
}

