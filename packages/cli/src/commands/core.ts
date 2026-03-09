// barefoot core — show core documentation (concepts, API, guides).

import path from 'path'
import { readFileSync } from 'fs'
import type { CliContext } from '../context'
import { scanCoreDocs, resolveDoc, parseFrontmatter } from '../lib/docs-loader'

function printDocList(docs: ReturnType<typeof scanCoreDocs>, jsonFlag: boolean) {
  if (jsonFlag) {
    console.log(JSON.stringify(docs.map(d => ({
      slug: d.slug,
      title: d.title,
      description: d.description,
      category: d.category,
    })), null, 2))
    return
  }

  if (docs.length === 0) {
    console.log('No documents found.')
    return
  }

  const nameWidth = Math.max(30, ...docs.map(d => d.slug.length + 2))
  const catWidth = 16
  const header = `${'NAME'.padEnd(nameWidth)}${'CATEGORY'.padEnd(catWidth)}DESCRIPTION`
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const d of docs) {
    console.log(`${d.slug.padEnd(nameWidth)}${d.category.padEnd(catWidth)}${d.description.slice(0, 60)}`)
  }
  console.log(`\n${docs.length} document(s) available. Use 'barefoot core <name>' to read.`)
}

function printDoc(slug: string, filePath: string, jsonFlag: boolean) {
  const content = readFileSync(filePath, 'utf-8')
  const { title, description, body } = parseFrontmatter(content)

  if (jsonFlag) {
    console.log(JSON.stringify({ slug, title, description, content: body }, null, 2))
    return
  }

  console.log(body)
}

export function run(args: string[], ctx: CliContext): void {
  const docsDir = path.join(ctx.root, 'docs/core')

  const query = args.join(' ')
  if (!query) {
    // List all available documents
    const docs = scanCoreDocs(docsDir)
    if (docs.length === 0) {
      console.error(`Error: Core documentation not found at ${docsDir}. Are you in the BarefootJS monorepo?`)
      process.exit(1)
    }
    printDocList(docs, ctx.jsonFlag)
    return
  }

  const { doc, candidates } = resolveDoc(docsDir, query)

  if (!doc && candidates.length > 0) {
    console.error(`Error: Ambiguous document name "${query}". Did you mean one of:`)
    for (const c of candidates) {
      console.error(`  barefoot core ${c.slug}`)
    }
    process.exit(1)
  }

  if (!doc) {
    console.error(`Error: Document "${query}" not found. Run 'barefoot core' to list available documents.`)
    process.exit(1)
  }

  printDoc(doc.slug, doc.filePath, ctx.jsonFlag)
}
