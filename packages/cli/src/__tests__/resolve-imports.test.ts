import { describe, test, expect, beforeEach, afterAll } from 'bun:test'
import { resolveRelativeImports } from '../lib/resolve-imports'
import { mkdirSync, writeFileSync, rmSync } from 'fs'
import { resolve } from 'path'
import { tmpdir } from 'os'

const TEST_DIR = resolve(tmpdir(), `bf-test-resolve-imports-${Date.now()}`)
const DIST_DIR = resolve(TEST_DIR, 'dist')
const COMPONENTS_DIR = resolve(DIST_DIR, 'components')
const SOURCE_DIR = resolve(TEST_DIR, 'src')

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
  mkdirSync(COMPONENTS_DIR, { recursive: true })
  mkdirSync(SOURCE_DIR, { recursive: true })
})

afterAll(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

describe('resolveRelativeImports', () => {
  test('inlines pure .ts module', async () => {
    // Write a utility module next to the client JS
    writeFileSync(resolve(COMPONENTS_DIR, 'utils.ts'), `
export function highlight(code: string): string {
  return '<pre>' + code + '</pre>'
}
`)
    // Write client JS that imports the utility
    const clientJs = `import { highlight } from './utils'
import { createSignal } from '@barefootjs/client'
console.log(highlight('hello'))
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Demo-abc123.js'), clientJs)

    const manifest = {
      Demo: { clientJs: 'components/Demo-abc123.js', markedTemplate: 'components/Demo.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Demo-abc123.js')).text()
    // Should contain the inlined function (without export keyword)
    expect(result).toContain('function highlight(code)')
    // Should NOT contain the original import
    expect(result).not.toContain("from './utils'")
    // Should keep package imports untouched
    expect(result).toContain("from '@barefootjs/client'")
  })

  test('replaces a named .tsx client-component import with a runtime-resolving stub (#1240)', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'ClientComp.tsx'), `'use client'
export function ClientComp() {
  return <div>client only</div>
}
`)
    const clientJs = `import { ClientComp } from './ClientComp'
import { createSignal } from '@barefootjs/client'
console.log('client code')
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Parent-abc123.js'), clientJs)

    const manifest = {
      Parent: { clientJs: 'components/Parent-abc123.js', markedTemplate: 'components/Parent.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Parent-abc123.js')).text()
    // The original `import` statement is gone — replaced with a stub that
    // delegates to `createComponent` so the local binding works in any
    // call shape (JSX, Record literal, .call(el, props), …).
    expect(result).not.toContain("from './ClientComp'")
    // The stub must keep the original local binding name.
    expect(result).toContain('const ClientComp =')
    expect(result).toContain("createComponent(\"ClientComp\", props, key)")
    // The stub relies on the host bundle already importing `createComponent`
    // from the umbrella `barefoot.js` runtime (every JSX-emitted client
    // bundle does, since `<X />` compiles to `createComponent(...)`). We
    // deliberately do NOT hoist a `from '@barefootjs/client/runtime'` line
    // — that bare specifier isn't on the page's importmap and would 404 in
    // the browser. See the comment on the stub branch in resolve-imports.ts.
    // Pre-existing imports + body lines stay intact.
    expect(result).toContain("from '@barefootjs/client'")
    expect(result).toContain("console.log('client code')")
    // The binding has a working definition → no dangling reference, no diagnostic.
    expect(errors).toHaveLength(0)
  })

  // Regression: bf#1258 — a sibling `.tsx` without the `'use client'`
  // directive is a plain server-side module (e.g. data + utility helpers
  // that happen to live in a `.tsx` file because they shape SSR JSX). The
  // runtime registry has no entry for `getPost`/`BLOG_POSTS`, so
  // `createComponent('getPost', slug, undefined)` is a wrong-shaped
  // descriptor, not a `BlogPost` — the consumer crashes, hydration aborts,
  // and the SSR DOM never animates back to its rendered state. Treat
  // non-`'use client'` `.tsx` the same as the pre-#1240 strip path: drop
  // the import, let the SSR template's server-side resolution carry the
  // value (the client bundle just doesn't get it).
  test('does not stub a sibling .tsx import that is NOT a use-client component (#1258)', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'blog-data.tsx'), `// Static blog post data — SSR-only, no 'use client' directive.
export interface BlogPost { slug: string; title: string }
export const BLOG_POSTS: BlogPost[] = [{ slug: 'a', title: 'A' }]
export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}
`)
    const clientJs = `import { BLOG_POSTS, getPost } from './blog-data'
import { createComponent } from '@barefootjs/client/runtime'
export function initBlogDemo(_p) {
  const post = getPost(_p.slug)
  return post?.title ?? BLOG_POSTS[0].title
}
`
    writeFileSync(resolve(COMPONENTS_DIR, 'BlogDemo-abc.js'), clientJs)
    const manifest = {
      BlogDemo: { clientJs: 'components/BlogDemo-abc.js', markedTemplate: 'components/BlogDemo.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'BlogDemo-abc.js')).text()
    // The import line is gone …
    expect(result).not.toContain("from './blog-data'")
    // … and crucially NO stub is emitted: a `createComponent('getPost', …)`
    // stub would silently return a malformed descriptor and break every
    // consumer that reads the value.
    expect(result).not.toContain('const getPost =')
    expect(result).not.toContain('const BLOG_POSTS =')
    // The original references stay as dangling identifiers — matching the
    // pre-#1240 behaviour. The SSR template (server-side) has the real
    // values; this client bundle's hydration may silently no-op, which is
    // the documented contract for non-stateful SSR-only modules.
    expect(result).toContain('getPost(_p.slug)')
    expect(result).toContain('BLOG_POSTS[0].title')
  })

  // Regression: bf#1258 — the playground client bundles take two paths to
  // the same sibling `'use client'` target:
  //   (1) the parent `.tsx` has `import { Foo } from './foo'`, which reaches
  //       `walkAndCollect` and (post-#1240) emits `const Foo = (props, key)
  //       => createComponent('Foo', ...)` at the top of the bundle;
  //   (2) esbuild bundled `./foo`'s compiled `.js` whole upstream, so the
  //       bundle already contains `export function Foo(_p, __bfKey) { ... }`.
  // Emitting (1) on top of (2) produces a duplicate top-level identifier and
  // the whole script fails to parse — every hydration in the bundle dies
  // silently, leaving SSR HTML with unsubstituted variant/signal slots.
  // Fix: skip stub emission for any name esbuild has already declared at
  // top level; for those, just strip the redundant import.
  test('does not emit a duplicate-binding stub when the bundle already declares the named import at top level (#1258)', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'CopyButton.tsx'), `'use client'
export function CopyButton() {
  return <button>copy</button>
}
`)
    // Simulates esbuild having already inlined CopyButton's compiled JS into
    // the parent bundle (real-world case: relative `./copy-button` import in
    // the source survives JSX compilation as a still-relative import in the
    // emitted client JS *and* esbuild's bundling pass inlines the target's
    // compiled output whole, so the same name appears twice).
    const clientJs = `import { CopyButton } from './CopyButton'
import { createComponent, hydrate } from '@barefootjs/client/runtime'
export function initCopyButton(__scope, _p = {}) { /* ... */ }
hydrate('CopyButton', { init: initCopyButton, template: (_p) => '<button>copy</button>' })
export function CopyButton(_p, __bfKey) { return createComponent('CopyButton', _p, __bfKey) }
console.log('parent bundle body')
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Playground-abc123.js'), clientJs)

    const manifest = {
      Playground: { clientJs: 'components/Playground-abc123.js', markedTemplate: 'components/Playground.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Playground-abc123.js')).text()
    // The redundant import is gone …
    expect(result).not.toContain("from './CopyButton'")
    // … but the stub MUST NOT be emitted — the bundle already declares
    // `function CopyButton(...)` lower down, and a second `const CopyButton`
    // at the top would make the whole script unparseable.
    expect(result).not.toContain('const CopyButton =')
    // The pre-existing inlined definition stays intact (this is the binding
    // that the runtime registry looks up via `createComponent('CopyButton', …)`).
    expect(result).toContain('export function CopyButton(_p, __bfKey)')
    expect(result).toContain("hydrate('CopyButton'")
    // No BF053 — the binding has a real definition, so no dangling reference.
    expect(errors).toHaveLength(0)
  })

  // Regression: bf#1227 used to surface BF053 when a stripped `'use client'`
  // import left a dangling reference. bf#1240 turns the strip into a
  // runtime-resolving stub instead, so the same call site that previously
  // crashed at runtime (the original `884173f` ReferenceError) now works.
  // BF053 still fires for non-stubbable shapes — see the default + namespace
  // tests below.
  test('replaces .tsx binding called from an inlined .ts helper with a runtime stub instead of stripping (#1240, supersedes #1227 dangling case)', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'DraftTitleEditor.tsx'), `'use client'
export function DraftTitleEditor() { return <textarea /> }
`)
    writeFileSync(resolve(COMPONENTS_DIR, 'IssueCardNode.ts'), `
import { DraftTitleEditor } from './DraftTitleEditor'
export function IssueCardNode() {
  return DraftTitleEditor({ initialTitle: '' })
}
`)
    const clientJs = `import { IssueCardNode } from './IssueCardNode'
IssueCardNode()
`
    writeFileSync(resolve(COMPONENTS_DIR, 'DeskCanvas-aaa.js'), clientJs)
    const manifest = {
      DeskCanvas: {
        clientJs: 'components/DeskCanvas-aaa.js',
        markedTemplate: 'components/DeskCanvas.tsx',
      },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    // No diagnostic — the binding now has a definition (the stub).
    expect(errors).toHaveLength(0)

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'DeskCanvas-aaa.js')).text()
    // The `.ts` helper got inlined; the stripped `.tsx` import inside it
    // becomes the runtime stub, so calling `DraftTitleEditor({…})` from
    // the helper resolves to `createComponent('DraftTitleEditor', …)` at
    // runtime instead of the previous ReferenceError.
    expect(result).toContain('const DraftTitleEditor =')
    expect(result).toContain("createComponent(\"DraftTitleEditor\", props, key)")
  })

  // BF053 still fires for the shapes the stub can't faithfully recreate —
  // namespace and default imports of a `'use client'` `.tsx` don't have a
  // single registry name to delegate to (default exports compile without a
  // stable JSX-registration name; namespace imports would need every export
  // enumerated against the registry). Per #1240 those fall back to the
  // pre-#1240 strip + BF053 path.
  test('still fires BF053 for namespace .tsx imports (no single registry name to stub)', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'NsClient.tsx'), `'use client'
export function NsClient() { return <div /> }
`)
    const clientJs = `import * as Ns from './NsClient'
console.log(Ns.NsClient)
`
    writeFileSync(resolve(COMPONENTS_DIR, 'NsParent-aaa.js'), clientJs)
    const manifest = {
      NsParent: { clientJs: 'components/NsParent-aaa.js', markedTemplate: 'components/NsParent.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('BF053')
    expect(errors[0].message).toContain('Ns')
  })

  test('still fires BF053 for default .tsx imports (no single registry name to stub)', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'DefClient.tsx'), `'use client'
export default function DefClient() { return <div /> }
`)
    const clientJs = `import Def from './DefClient'
Def()
`
    writeFileSync(resolve(COMPONENTS_DIR, 'DefParent-aaa.js'), clientJs)
    const manifest = {
      DefParent: { clientJs: 'components/DefParent-aaa.js', markedTemplate: 'components/DefParent.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('BF053')
    expect(errors[0].message).toContain('Def')
  })

  // Sanity: stripping is fine when the import was for types-only or
  // side-effects and no value reference survives. Locks the fix to the
  // dangling-reference case so we don't over-trigger BF053.
  test('does not error when stripped .tsx binding is unused at the call site', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'TypesOnly.tsx'), `'use client'
export function TypesOnly() { return <div /> }
`)
    const clientJs = `import { TypesOnly } from './TypesOnly'
console.log('client code')
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Quiet-bbb.js'), clientJs)
    const manifest = {
      Quiet: { clientJs: 'components/Quiet-bbb.js', markedTemplate: 'components/Quiet.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    expect(errors).toHaveLength(0)
  })

  test('deduplicates same module imported by two client JS files', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'shared-utils.ts'), `
export const VERSION = '1.0'
`)
    const clientJsA = `import { VERSION } from './shared-utils'
console.log('A', VERSION)
`
    const clientJsB = `import { VERSION } from './shared-utils'
console.log('B', VERSION)
`
    writeFileSync(resolve(COMPONENTS_DIR, 'CompA-aaa.js'), clientJsA)
    writeFileSync(resolve(COMPONENTS_DIR, 'CompB-bbb.js'), clientJsB)

    const manifest = {
      CompA: { clientJs: 'components/CompA-aaa.js', markedTemplate: 'components/CompA.tsx' },
      CompB: { clientJs: 'components/CompB-bbb.js', markedTemplate: 'components/CompB.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const resultA = await Bun.file(resolve(COMPONENTS_DIR, 'CompA-aaa.js')).text()
    const resultB = await Bun.file(resolve(COMPONENTS_DIR, 'CompB-bbb.js')).text()
    // Both should have the inlined code (dedup is per-file, not cross-file)
    expect(resultA).toContain('VERSION')
    expect(resultB).toContain('VERSION')
    expect(resultA).not.toContain("from './shared-utils'")
    expect(resultB).not.toContain("from './shared-utils'")
  })

  test('no-op when no relative imports', async () => {
    const clientJs = `import { createSignal } from '@barefootjs/client'
const [count, setCount] = createSignal(0)
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Counter-xyz.js'), clientJs)

    const manifest = {
      Counter: { clientJs: 'components/Counter-xyz.js', markedTemplate: 'components/Counter.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Counter-xyz.js')).text()
    expect(result).toBe(clientJs)
  })

  test('strips import at EOF without trailing newline', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'eof-utils.tsx'), `
export function EofComp() { return <div /> }
`)
    // No trailing newline after import
    const clientJs = `console.log('main code')\nimport { EofComp } from './eof-utils'`
    writeFileSync(resolve(COMPONENTS_DIR, 'Eof-222.js'), clientJs)

    const manifest = {
      Eof: { clientJs: 'components/Eof-222.js', markedTemplate: 'components/Eof.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Eof-222.js')).text()
    expect(result).not.toContain('eof-utils')
    expect(result).toContain("console.log('main code')")
  })

  test('strips missing module import without crashing', async () => {
    const clientJs = `import { missing } from './nonexistent'
console.log('still works')
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Broken-111.js'), clientJs)

    const manifest = {
      Broken: { clientJs: 'components/Broken-111.js', markedTemplate: 'components/Broken.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Broken-111.js')).text()
    expect(result).not.toContain('nonexistent')
    expect(result).toContain("console.log('still works')")
    // Dropped binding is unused — no BF053 expected.
    expect(errors).toHaveLength(0)
  })

  // Coverage: namespace import (`import * as ns from '.tsx'`) gets stripped,
  // and `ns.foo()` survives → BF053 must fire on the namespace binding.
  // The reference is placed deliberately on line 3 of the input so we can
  // assert that `loc` reports a non-placeholder position in the
  // post-strip bundle (line 2 after the single import line is removed).
  test('errors when stripped namespace binding is referenced', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'NsClient.tsx'), `'use client'
export function Foo() { return <div /> }
`)
    const clientJs = `import * as ns from './NsClient'
const greeting = 'hi'
ns.Foo()
`
    writeFileSync(resolve(COMPONENTS_DIR, 'NsParent-aaa.js'), clientJs)
    const manifest = {
      NsParent: { clientJs: 'components/NsParent-aaa.js', markedTemplate: 'components/NsParent.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('BF053')
    expect(errors[0].message).toContain('ns')
    expect(errors[0].message).toContain('./NsClient')
    // Position points at the post-strip bundle: the import line is gone,
    // `const greeting = 'hi'` is now line 1, and `ns.Foo()` lands on
    // line 2. That's the dev-facing location the error should navigate to.
    expect(errors[0].loc.start.line).toBe(2)
    expect(errors[0].loc.start.column).toBe(0)
  })

  // Coverage: default import (`import D from '.tsx'`) gets stripped,
  // and `D()` survives → BF053 must fire on the default binding.
  test('errors when stripped default binding is referenced', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'DefClient.tsx'), `'use client'
export default function DefClient() { return <div /> }
`)
    const clientJs = `import DefClient from './DefClient'
DefClient()
`
    writeFileSync(resolve(COMPONENTS_DIR, 'DefParent-aaa.js'), clientJs)
    const manifest = {
      DefParent: { clientJs: 'components/DefParent-aaa.js', markedTemplate: 'components/DefParent.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('BF053')
    expect(errors[0].message).toContain('DefClient')
  })

  // Coverage: a `missing`-strip whose binding survives reference. Distinct
  // message from the `.tsx` case — the remediation is "fix the path", not
  // "render as JSX from 'use client' parent". Locks the per-kind wording
  // added for #1227 review feedback #1.
  test('errors with missing-path-specific wording when unresolved binding is referenced', async () => {
    const clientJs = `import { stillUsed } from './nonexistent'
stillUsed()
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Dangling-aaa.js'), clientJs)
    const manifest = {
      Dangling: { clientJs: 'components/Dangling-aaa.js', markedTemplate: 'components/Dangling.tsx' },
    }

    const { errors } = await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    expect(errors).toHaveLength(1)
    expect(errors[0].code).toBe('BF053')
    expect(errors[0].message).toContain('stillUsed')
    expect(errors[0].message).toContain('./nonexistent')
    // Per-kind diagnostic — missing strip is about path resolution,
    // not 'use client' boundary.
    expect(errors[0].message).toContain('could not be resolved')
    expect(errors[0].message).not.toContain('use client')
  })

  test('recursively inlines transitive .ts imports', async () => {
    // Leaf module — depended on by the middle layer
    writeFileSync(resolve(COMPONENTS_DIR, 'leaf.ts'), `
export const FRUITS = ['apple', 'banana']
`)
    // Middle module — references the leaf at module-load time
    writeFileSync(resolve(COMPONENTS_DIR, 'middle.ts'), `
import { FRUITS } from './leaf'
export const COUNT = FRUITS.length
`)
    // Client JS imports middle but not leaf
    const clientJs = `import { COUNT } from './middle'
console.log(COUNT)
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Comp-trans.js'), clientJs)

    const manifest = {
      Comp: { clientJs: 'components/Comp-trans.js', markedTemplate: 'components/Comp.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Comp-trans.js')).text()
    // Both leaf and middle should be inlined, with leaf's declaration first
    // so that middle's reference to FRUITS resolves at module init.
    expect(result).toContain('FRUITS')
    expect(result).toContain('COUNT')
    expect(result).not.toContain("from './middle'")
    expect(result).not.toContain("from './leaf'")
    const fruitsIdx = result.indexOf("const FRUITS")
    const countIdx = result.indexOf("const COUNT")
    expect(fruitsIdx).toBeGreaterThan(-1)
    expect(countIdx).toBeGreaterThan(fruitsIdx)
    // No stray `{ FRUITS, ... }` block statement left over from the export.
    expect(result).not.toMatch(/^\s*\{\s*FRUITS\s*\}/m)
  })

  test('resolves from sourceDirs when not found relative to client JS', async () => {
    // Module exists in SOURCE_DIR, not in COMPONENTS_DIR
    writeFileSync(resolve(SOURCE_DIR, 'helpers.ts'), `
export function formatDate(d: Date): string {
  return d.toISOString()
}
`)
    const clientJs = `import { formatDate } from './helpers'
console.log(formatDate(new Date()))
`
    writeFileSync(resolve(COMPONENTS_DIR, 'DatePicker-fff.js'), clientJs)

    const manifest = {
      DatePicker: { clientJs: 'components/DatePicker-fff.js', markedTemplate: 'components/DatePicker.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest, sourceDirs: [SOURCE_DIR] })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'DatePicker-fff.js')).text()
    expect(result).toContain('function formatDate(d)')
    expect(result).not.toContain("from './helpers'")
  })

  // Regression: bf#1133 — a 'use client' component importing a sibling .ts
  // helper at its OWN source location (not under any global sourceDir) had
  // its import line stripped because the resolver only searched the dist dir.
  // The fix is to thread each manifest entry's source directory through
  // sourceDirsByManifestKey so the helper can be located and inlined.
  test('resolves sibling .ts via sourceDirsByManifestKey (bf#1133)', async () => {
    // Source layout: src/components/canvas/{DeskCanvas.tsx,useYjs.ts}
    const SRC_CANVAS = resolve(SOURCE_DIR, 'components', 'canvas')
    mkdirSync(SRC_CANVAS, { recursive: true })
    writeFileSync(resolve(SRC_CANVAS, 'useYjs.ts'), `
export function useYjs(roomId: string, readOnly: boolean) {
  return { roomId, readOnly }
}
`)

    // Dist layout: dist/components/canvas/DeskCanvas-abc.js (no sibling useYjs there)
    const DIST_CANVAS = resolve(COMPONENTS_DIR, 'canvas')
    mkdirSync(DIST_CANVAS, { recursive: true })
    const clientJs = `import { useYjs } from './useYjs'
import { hydrate } from '@barefootjs/client/runtime'
export function initDeskCanvas(__scope, _p = {}) {
  const yjs = useYjs(_p.roomId, _p.readOnly)
  return yjs
}
`
    writeFileSync(resolve(DIST_CANVAS, 'DeskCanvas-abc.js'), clientJs)

    const manifest = {
      DeskCanvas: {
        clientJs: 'components/canvas/DeskCanvas-abc.js',
        markedTemplate: 'components/canvas/DeskCanvas.tsx',
      },
    }

    await resolveRelativeImports({
      distDir: DIST_DIR,
      manifest,
      sourceDirsByManifestKey: { DeskCanvas: [SRC_CANVAS] },
    })

    const result = await Bun.file(resolve(DIST_CANVAS, 'DeskCanvas-abc.js')).text()
    // Helper inlined — both the function and its call site are present.
    expect(result).toContain('function useYjs(roomId, readOnly)')
    expect(result).toContain('useYjs(_p.roomId, _p.readOnly)')
    // Original import line stripped (replaced by inlined declaration).
    expect(result).not.toContain("from './useYjs'")
    // Untouched module imports stay.
    expect(result).toContain("from '@barefootjs/client/runtime'")
  })

  // Regression: bf#1242 — the predecessor walker matched relative imports
  // with a line-anchored regex whose `.` did not span newlines, so a
  // multi-line `import { ... } from './x'` clause (with or without embedded
  // line comments) silently failed to match and the import survived the
  // walk. The AST splice walks `ImportDeclaration` nodes regardless of
  // source formatting.
  test('inlines a multi-line named import with embedded line comments (#1242)', async () => {
    writeFileSync(resolve(COMPONENTS_DIR, 'multiline-utils.ts'), `
export const FOO = 1
export const BAR = 2
`)
    const clientJs = `import {
  FOO,
  // a comment in the middle of the clause
  BAR,
} from './multiline-utils'
console.log(FOO, BAR)
`
    writeFileSync(resolve(COMPONENTS_DIR, 'Multi-abc.js'), clientJs)
    const manifest = {
      Multi: { clientJs: 'components/Multi-abc.js', markedTemplate: 'components/Multi.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'Multi-abc.js')).text()
    // Import is gone and the module body is inlined.
    expect(result).not.toContain("from './multiline-utils'")
    expect(result).toContain('FOO = 1')
    expect(result).toContain('BAR = 2')
    expect(result).toContain('console.log(FOO, BAR)')
  })

  // Regression: bf#1242 — the predecessor walker built an unanchored
  // regex from the matched import text and applied it with a plain
  // `.replace(re, ...)`, which strips the FIRST occurrence in the file.
  // If the same byte sequence appears earlier inside a string literal,
  // the splice hits the literal instead of the real import. The AST
  // splice uses node start/end offsets, so the string literal is left
  // untouched and the real import is removed.
  test('splices the real import even when the same text appears in a string literal (#1242)', async () => {
    const clientJs = `const HELP_MESSAGE = "import { missingBinding } from './nonexistent'"
import { missingBinding } from './nonexistent'
console.log(HELP_MESSAGE)
`
    writeFileSync(resolve(COMPONENTS_DIR, 'StringLit-abc.js'), clientJs)
    const manifest = {
      StringLit: { clientJs: 'components/StringLit-abc.js', markedTemplate: 'components/StringLit.tsx' },
    }

    await resolveRelativeImports({ distDir: DIST_DIR, manifest })

    const result = await Bun.file(resolve(COMPONENTS_DIR, 'StringLit-abc.js')).text()
    // String literal is preserved byte-identical — the splice must not
    // have touched it.
    expect(result).toContain(`"import { missingBinding } from './nonexistent'"`)
    // The real top-level import statement is removed (no `import` keyword
    // at the start of any line referencing './nonexistent').
    expect(result).not.toMatch(/^import[^\n]*from '\.\/nonexistent'/m)
    expect(result).toContain('console.log(HELP_MESSAGE)')
  })
})
