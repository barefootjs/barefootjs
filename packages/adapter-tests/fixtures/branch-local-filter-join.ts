import { createFixture } from '../src/types'

/**
 * Branch-local higher-order chain at an attribute position (#1421).
 *
 * Mirrors the scaffold `Slot` shape: `const merged = [a, b].filter(Boolean)
 * .join(' ')` declared inside an `if (...)` branch, then referenced at a
 * JSX attribute. Branch-local inlining (#1415) substitutes the chain's
 * RHS into the attribute position, so the adapter receives the full
 * higher-order expression to translate.
 *
 * The Hono adapter inlines the expression verbatim (the CSR runtime
 * computes it at hydration time). Template-language adapters (Mojo, Go)
 * can't lower an array-literal callee into their expression dialect, so
 * they record BF101 instead — see each adapter's `expectedDiagnostics`.
 *
 * Pre-fix regression: Mojo's `convertHigherOrderExpr` ↔ unsupported-
 * emitter loop had no terminator and crashed `bf build` with a Node
 * stack overflow before this fixture's compile finished.
 */
export const fixture = createFixture({
  id: 'branch-local-filter-join',
  description: 'Branch-local .filter(Boolean).join() chain inlined at an attribute',
  source: `
function BranchLocalFilterJoin({ on, label }: { on?: boolean; label?: string }) {
  if (on) {
    const merged = [label, 'extra'].filter(Boolean).join(' ')
    return <div className={merged}>x</div>
  }
  return <div>fallback</div>
}
export { BranchLocalFilterJoin }
`,
  expectedHtml: `
    <div bf-s="test">fallback</div>
  `,
})
