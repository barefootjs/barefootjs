/**
 * Hono application for the BarefootJS documentation site.
 *
 * Registers routes for each markdown page:
 *   GET /{slug}     → Rendered HTML
 *   GET /{slug}.md  → Raw Markdown
 *
 * Quick Start (slug `quick-start`) is rendered through a JSX handler
 * instead of pure markdown so we can embed `<PackageManagerTabs>` for
 * the `npm create barefootjs@latest` command. Authors put a placeholder
 * comment in the markdown source — the handler splits the rendered
 * HTML around it and slots the component in between.
 */

import { Hono } from 'hono'
import { renderer } from './renderer'
import { initHighlighter, renderMarkdown, parseFrontmatter } from './lib/markdown'
import { getDocsNavLinks } from './lib/navigation'
import type { Page, ContentMap } from './lib/content'
import type { TocItem } from '../shared/components/table-of-contents'
import { PackageManagerTabs } from '@/components/package-manager-tabs'

const QUICK_START_PM_TABS_PLACEHOLDER = '<!-- pm-tabs:create barefootjs@latest my-app -->'

async function renderQuickStart(pageContent: string) {
  const { frontmatter, body } = parseFrontmatter(pageContent)
  const [beforeRaw, afterRaw] = body.split(QUICK_START_PM_TABS_PLACEHOLDER)
  const before = await renderMarkdown(beforeRaw)
  const after = await renderMarkdown(afterRaw ?? '')
  const toc: TocItem[] = [...before.toc, ...after.toc]
  return { frontmatter, before, after, toc }
}

/**
 * Create the Hono app with routes for all documentation pages.
 *
 * @param content - Map of slug → raw markdown content
 * @param pages   - List of page metadata (slug, name)
 */
export async function createDocsApp(content: ContentMap, pages: Page[]): Promise<Hono> {
  await initHighlighter()

  const app = new Hono()
  app.use(renderer)

  // All pages: HTML version + raw Markdown version
  for (const page of pages.filter((p) => p.slug !== '')) {
    const pageContent = content[page.slug]
    if (pageContent === undefined) continue

    if (page.slug === 'quick-start') {
      app.get(`/${page.slug}`, async (c) => {
        const { frontmatter, before, after, toc } = await renderQuickStart(pageContent)
        const navLinks = getDocsNavLinks(page.slug)
        return c.render(
          <>
            <div dangerouslySetInnerHTML={{ __html: before.html }} />
            <PackageManagerTabs command="barefootjs@latest my-app" mode="create" />
            <div dangerouslySetInnerHTML={{ __html: after.html }} />
          </>,
          {
            title: frontmatter.title,
            description: frontmatter.description,
            slug: page.slug,
            toc,
            prev: navLinks.prev,
            next: navLinks.next,
          }
        )
      })
    } else {
      app.get(`/${page.slug}`, async (c) => {
        const parsed = await renderMarkdown(pageContent)

        // Collect extra meta tags from frontmatter
        const meta: Record<string, string> = {}
        for (const [key, value] of Object.entries(parsed.frontmatter)) {
          if (key !== 'title' && key !== 'description' && value) {
            meta[key] = value
          }
        }

        const navLinks = getDocsNavLinks(page.slug)

        return c.render(
          <div dangerouslySetInnerHTML={{ __html: parsed.html }} />,
          {
            title: parsed.frontmatter.title,
            description: parsed.frontmatter.description,
            meta: Object.keys(meta).length > 0 ? meta : undefined,
            slug: page.slug,
            toc: parsed.toc,
            prev: navLinks.prev,
            next: navLinks.next,
          }
        )
      })
    }

    // Raw Markdown version
    app.get(`/${page.slug}.md`, (c) => {
      c.header('Content-Type', 'text/markdown; charset=utf-8')
      return c.body(pageContent)
    })
  }

  return app
}
