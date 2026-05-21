// bf tokens — list design tokens by category.
//
// Resolution order for the base TokenSet, mirroring `bf guide`:
//   1. `<projectDir>/<paths.tokens>/tokens.json`   — user's full override
//   2. `<repoRoot>/site/shared/tokens/tokens.json` — monorepo source
//   3. `<cli-dist>/tokens.json`                    — bundled default
//
// The first two only fire in the matching environments; the third is
// the fallback that lets `bf tokens` work inside scaffolded apps where
// neither (1) nor (2) is present.

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CliContext } from '../context'
import type { TokenSet, Token, ColorToken } from '../../../../site/shared/tokens/schema'
import { fileExists } from '../lib/runtime'

const thisFile = fileURLToPath(import.meta.url)

type CategoryName = 'typography' | 'spacing' | 'borderRadius' | 'transitions' | 'layout' | 'colors' | 'shadows'

const CATEGORY_NAMES: CategoryName[] = [
  'typography', 'spacing', 'borderRadius', 'transitions', 'layout', 'colors', 'shadows',
]

async function loadTokens(jsonPath: string): Promise<TokenSet> {
  const content = await readFile(jsonPath, 'utf-8')
  return JSON.parse(content) as TokenSet
}

/**
 * Merge multiple TokenSets. Later sets override earlier ones (by token name).
 * Mirrors `site/shared/tokens/generate-css.ts#mergeTokenSets` — kept inline
 * here so the published CLI doesn't need a runtime dependency on the
 * workspace-only `site/shared` package.
 */
function mergeTokenSets(...sets: TokenSet[]): TokenSet {
  if (sets.length === 0) throw new Error('mergeTokenSets requires at least one TokenSet')
  if (sets.length === 1) return sets[0]

  const base = structuredClone(sets[0])

  for (let i = 1; i < sets.length; i++) {
    const ext = sets[i]
    mergeTokenArray(base.typography.fontFamily, ext.typography.fontFamily)
    mergeTokenArray(base.typography.letterSpacing, ext.typography.letterSpacing)
    mergeTokenArray(base.spacing, ext.spacing)
    mergeTokenArray(base.borderRadius, ext.borderRadius)
    mergeTokenArray(base.transitions.duration, ext.transitions.duration)
    mergeTokenArray(base.transitions.easing, ext.transitions.easing)
    mergeTokenArray(base.layout, ext.layout)
    mergeTokenArray(base.colors, ext.colors)
    mergeTokenArray(base.shadows, ext.shadows)
  }

  return base
}

function mergeTokenArray<T extends Token>(base: T[], ext: T[]): void {
  for (const token of ext) {
    const idx = base.findIndex(t => t.name === token.name)
    if (idx >= 0) {
      base[idx] = token
    } else {
      base.push(token)
    }
  }
}

/**
 * Locate the base `tokens.json` to load. Search order:
 *   1. Monorepo source — `<repoRoot>/site/shared/tokens/tokens.json`
 *      (this is the canonical version checked into the repo)
 *   2. Bundled default — `<cli-dist>/tokens.json` (copied next to the
 *      bundle by `scripts/build.mjs` so the published CLI carries it)
 *
 * Returns `null` only when both candidates are missing — the caller
 * surfaces the user-facing error.
 */
function findBaseTokensJson(ctx: CliContext): string | null {
  const monorepoTokens = resolve(ctx.root, 'site/shared/tokens/tokens.json')
  if (existsSync(monorepoTokens)) return monorepoTokens

  // In the bundled CLI, `dist/index.js` sits next to `dist/tokens.json`.
  // In source mode (running TS directly via `bun packages/cli/src/index.ts`)
  // `import.meta.url` resolves to `.../packages/cli/src/commands/tokens.ts`
  // and this path won't exist — that's fine, the monorepo fallback above
  // already handled it.
  const bundledTokens = resolve(dirname(thisFile), 'tokens.json')
  if (existsSync(bundledTokens)) return bundledTokens

  return null
}

async function loadTokenSet(ctx: CliContext): Promise<TokenSet> {
  // 1. User-supplied full override under <paths.tokens>/tokens.json.
  //    When present we honour it as the *base* (no merging with the
  //    bundled defaults) so the user has total control — they opted in
  //    by maintaining the file.
  if (ctx.projectDir && ctx.config?.paths.tokens) {
    const userTokens = resolve(ctx.projectDir, ctx.config.paths.tokens, 'tokens.json')
    if (await fileExists(userTokens)) {
      return loadTokens(userTokens)
    }
  }

  // 2. Default base — monorepo source or bundled CLI fallback.
  const basePath = findBaseTokensJson(ctx)
  if (!basePath) {
    throw new Error(
      'Cannot locate default tokens.json. Reinstall @barefootjs/cli — the published tarball should include it.',
    )
  }
  const base = await loadTokens(basePath)

  // 3. Monorepo-only: merge in the UI extension layer when present.
  //    End-user projects don't have `site/ui/tokens.json`; this branch is
  //    a no-op there.
  const uiJsonPath = resolve(ctx.root, 'site/ui/tokens.json')
  if (await fileExists(uiJsonPath)) {
    const ext = await loadTokens(uiJsonPath)
    return mergeTokenSets(base, ext)
  }
  return base
}

function flattenTokens(tokenSet: TokenSet, category?: CategoryName): Token[] {
  const result: Token[] = []

  function add(cat: CategoryName, tokens: Token[]) {
    if (category && category !== cat) return
    result.push(...tokens)
  }

  add('typography', [...tokenSet.typography.fontFamily, ...tokenSet.typography.letterSpacing])
  add('spacing', tokenSet.spacing)
  add('borderRadius', tokenSet.borderRadius)
  add('transitions', [...tokenSet.transitions.duration, ...tokenSet.transitions.easing])
  add('layout', tokenSet.layout)
  add('colors', tokenSet.colors)
  add('shadows', tokenSet.shadows)

  return result
}

function printTokens(tokens: Token[], jsonFlag: boolean) {
  if (jsonFlag) {
    console.log(JSON.stringify(tokens, null, 2))
    return
  }

  if (tokens.length === 0) {
    console.log('No tokens found.')
    return
  }

  const nameWidth = Math.max(25, ...tokens.map(t => t.name.length + 4))
  const header = `${'NAME'.padEnd(nameWidth)}VALUE`
  console.log(header)
  console.log('-'.repeat(header.length + 20))

  for (const t of tokens) {
    const name = `--${t.name}`
    const dark = (t as ColorToken).dark
    const darkSuffix = dark ? `  (dark: ${dark})` : ''
    console.log(`${name.padEnd(nameWidth)}${t.value}${darkSuffix}`)
  }
  console.log(`\n${tokens.length} token(s)`)
}

export async function run(args: string[], ctx: CliContext): Promise<void> {
  // Parse --category flag
  let category: CategoryName | undefined
  const catIdx = args.indexOf('--category')
  if (catIdx >= 0 && args[catIdx + 1]) {
    const val = args[catIdx + 1] as CategoryName
    if (!CATEGORY_NAMES.includes(val)) {
      console.error(`Unknown category: ${val}`)
      console.error(`Available: ${CATEGORY_NAMES.join(', ')}`)
      process.exit(1)
    }
    category = val
  }

  const tokenSet = await loadTokenSet(ctx)
  const tokens = flattenTokens(tokenSet, category)
  printTokens(tokens, ctx.jsonFlag)
}
