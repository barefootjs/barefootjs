/**
 * Generate expectedHtml for all fixtures using the Hono adapter as reference.
 *
 * Usage: bun run packages/adapter-tests/scripts/generate-expected-html.ts
 *
 * This compiles each fixture with HonoAdapter, renders to HTML, normalizes it,
 * formats with indentation, and writes the expectedHtml back into the fixture files.
 */

import { HonoAdapter } from '@barefootjs/hono/adapter'
import { renderHonoComponent } from '@barefootjs/hono/test-render'
import { normalizeHTML } from '../src/jsx-runner'
import { indentHTML } from '../src/indent-html'
import { jsxFixtures } from '../fixtures'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const FIXTURES_DIR = resolve(import.meta.dir, '../fixtures')

async function main() {
  let updated = 0
  let failed = 0

  for (const fixture of jsxFixtures) {
    try {
      const adapter = new HonoAdapter()
      const html = await renderHonoComponent({
        source: fixture.source,
        adapter,
        props: fixture.props,
        components: fixture.components,
      })

      const normalizedHtml = normalizeHTML(html)
      const indentedHtml = indentHTML(normalizedHtml)
      const expectedHtmlBlock = `  expectedHtml: \`${indentedHtml}\`,`

      // Read the fixture file and update it
      const filePath = resolve(FIXTURES_DIR, `${fixture.id}.ts`)
      let content = readFileSync(filePath, 'utf-8')

      if (content.includes('expectedHtml:')) {
        // Replace existing expectedHtml (single-line or multi-line)
        content = content.replace(
          /  expectedHtml: `[^`]*`,/s,
          expectedHtmlBlock,
        )
      } else {
        // Insert expectedHtml before the closing `})`
        content = content.replace(
          /\}\)\s*$/,
          `${expectedHtmlBlock}\n})\n`,
        )
      }

      writeFileSync(filePath, content)
      console.log(`✓ ${fixture.id}`)
      updated++
    } catch (err) {
      console.error(`✗ ${fixture.id}: ${(err as Error).message}`)
      failed++
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
