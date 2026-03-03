/**
 * Combines parent and child component client JS into single self-contained files.
 *
 * During compilation, child component dependencies are marked with placeholder imports:
 *   import '/* @bf-child:ChildName *​/'
 *
 * This function resolves those placeholders by inlining the child's client JS code
 * into the parent's file, eliminating the need for separate HTTP requests.
 */

const CHILD_PLACEHOLDER_RE = /import '\/\* @bf-child:(\w+) \*\/'/g

/**
 * Combine parent-child client JS files by inlining child code into parent files.
 *
 * @param files Map of component name → client JS content
 * @returns Map of component name → combined client JS content (only entries that changed)
 */
export function combineParentChildClientJs(
  files: Map<string, string>
): Map<string, string> {
  const result = new Map<string, string>()

  // Build case-insensitive lookup by file/manifest name
  const lookup = new Map<string, string>()
  for (const [name, content] of files) {
    lookup.set(name.toLowerCase(), content)
  }

  // Secondary lookup: map component name → file name for multi-component files.
  // e.g., icon/index.tsx exports CopyIcon + CheckIcon, keyed as "icon" in the manifest.
  // componentToFile maps "copyicon" → "icon", "checkicon" → "icon".
  const componentToFile = new Map<string, string>()
  for (const [name, content] of files) {
    for (const match of content.matchAll(/hydrate\('(\w+)'/g)) {
      componentToFile.set(match[1].toLowerCase(), name.toLowerCase())
    }
  }

  for (const [name, content] of files) {
    const childNames = [...content.matchAll(CHILD_PLACEHOLDER_RE)].map(m => m[1])
    if (childNames.length === 0) continue

    const processed = new Set<string>()
    const importsBySource = new Map<string, Set<string>>()
    const otherImports: string[] = []
    const codeSections: string[] = []

    function collectDescendant(childName: string) {
      const key = childName.toLowerCase()
      if (processed.has(key)) return
      processed.add(key)

      let childContent = lookup.get(key)
      if (!childContent) {
        // Fallback: resolve component name → file name for multi-component files.
        // Also mark the file name as processed so that other components from the
        // same file (e.g., CheckIcon when CopyIcon was already resolved from "icon")
        // don't inline the same file content again.
        const fileName = componentToFile.get(key)
        if (!fileName || processed.has(fileName)) return
        processed.add(fileName)
        childContent = lookup.get(fileName)
      }
      if (!childContent) return

      // Depth-first: collect grandchildren before the child itself
      const grandChildren = [...childContent.matchAll(CHILD_PLACEHOLDER_RE)].map(m => m[1])
      for (const gc of grandChildren) {
        collectDescendant(gc)
      }

      parseAndMerge(childContent, importsBySource, otherImports, codeSections)
    }

    for (const child of childNames) {
      collectDescendant(child)
    }

    // Parse parent (strip placeholders)
    parseAndMerge(
      content.replace(CHILD_PLACEHOLDER_RE, ''),
      importsBySource, otherImports, codeSections
    )

    // Generate combined output
    const importLines: string[] = []
    for (const [source, names] of importsBySource) {
      importLines.push(`import { ${[...names].sort().join(', ')} } from '${source}'`)
    }

    result.set(name, [...importLines, ...otherImports, '', ...codeSections].join('\n'))
  }

  return result
}

function parseAndMerge(
  content: string,
  importsBySource: Map<string, Set<string>>,
  otherImports: string[],
  codeSections: string[]
): void {
  const codeLines: string[] = []

  for (const line of content.split('\n')) {
    if (line.startsWith('import ')) {
      if (line.includes('@bf-child:')) continue

      const match = line.match(/^import \{ ([^}]+) \} from ['"]([^'"]+)['"]/)
      if (match) {
        const names = match[1].split(',').map(n => n.trim())
        const source = match[2]
        if (!importsBySource.has(source)) {
          importsBySource.set(source, new Set())
        }
        for (const name of names) {
          importsBySource.get(source)!.add(name)
        }
      } else {
        if (!otherImports.includes(line)) {
          otherImports.push(line)
        }
      }
    } else {
      codeLines.push(line)
    }
  }

  const code = codeLines.join('\n').trim()
  if (code) {
    codeSections.push(code)
  }
}
