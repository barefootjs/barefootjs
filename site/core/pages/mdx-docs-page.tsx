/**
 * Generic MDX docs page handler.
 *
 * Registers HTML + raw-markdown routes for any `.mdx` page that uses
 * `<Tabs>` / `<Tab>` blocks. Mirrors the pattern from `quick-start.tsx`
 * but supports block-level components (adapter code tabs).
 */

import type { Hono } from 'hono'
import { renderMdx, projectMdxToMarkdown, defaultMdxProjectors, type MdxRenderPart } from '../lib/mdx'
import { getDocsNavLinks } from '../lib/navigation'
import { DocsTabs } from '@barefootjs/site-shared/components/docs-tabs'

function renderPart(part: MdxRenderPart) {
  if (part.type === 'html') {
    return <div dangerouslySetInnerHTML={{ __html: part.html }} />
  }
  if (part.type === 'block-component' && part.name === 'Tabs') {
    const tabs = part.children.map((child) => ({
      label: child.props.label || '',
      html: child.html,
    }))
    const defaultTab = part.props.default || tabs[0]?.label || ''
    return <DocsTabs id={part.props.id || ''} defaultTab={defaultTab} tabs={tabs} />
  }
  return null
}

export function registerMdxDocsRoutes(app: Hono, slug: string, mdxSource: string): void {
  const routePath = slug === '' ? '/' : `/${slug}`
  const mdPath = slug === '' ? '/README.md' : `/${slug}.md`

  app.get(routePath, async (c) => {
    const { frontmatter, toc, parts } = await renderMdx(mdxSource)
    const navLinks = getDocsNavLinks(slug)
    return c.render(
      <>{parts.map(renderPart)}</>,
      {
        title: frontmatter.title,
        description: frontmatter.description,
        slug,
        toc,
        prev: navLinks.prev,
        next: navLinks.next,
      },
    )
  })

  app.get(mdPath, (c) => {
    c.header('Content-Type', 'text/markdown; charset=utf-8')
    return c.body(projectMdxToMarkdown(mdxSource, defaultMdxProjectors))
  })
}
