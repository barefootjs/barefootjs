# Performance baselines

Recorded baselines for the perf / scale work tracked under [#1244](https://github.com/piconic-ai/barefootjs/issues/1244).
Numbers are indicative (single machine, Bun + happy-dom); the value is the **shape of growth**, not the absolute milliseconds.

Run the suites with:

```sh
bun bench            # all benchmark files under benchmarks/
bun run benchmarks/deep-tree.ts   # a single suite
```

## Deep-tree re-render — depth 50/100/200, one reactive leaf ([#1373](https://github.com/piconic-ai/barefootjs/issues/1373))

Fixture: `benchmarks/deep-tree.ts`. A tree of nested `createRoot` scopes (each models a
component boundary) wrapping real DOM nodes, with a **single** `createSignal` + `createEffect`
at the deepest leaf. Updating the leaf is the "re-render" under test.

| Metric | depth 50 | depth 100 | depth 200 |
|---|---|---|---|
| mount (build whole tree) | ~0.19 ms | ~0.13 ms | ~0.21 ms |
| update → leaf propagation | ~0.0017 ms | ~0.0010 ms | ~0.0008 ms |
| effect runs per update | 1.00 | 1.00 | 1.00 |

Shallow vs. deep at the **same node count** (N = 200):

| Metric | deep (200×1) | shallow (1×200) |
|---|---|---|
| update → leaf | ~0.0010 ms | ~0.0008 ms |
| mount | ~0.15 ms | ~0.12 ms |

GC after unmount (WeakRef liveness): root and leaf nodes are **collected** after `dispose()` + `Bun.gc()`.

### Findings

- **Update propagation is O(1) in depth, not O(depth).** BarefootJS reactivity is fine-grained
  (SolidJS-style): a signal notifies only its own subscriber set (`reactive.ts` `set()`), never the
  owner tree. A leaf update at depth 200 runs exactly one effect — the same cost as a shallow tree.
- **Mount is linear in node count, with no depth-specific term.** Deep and shallow trees of equal
  node count mount in comparable time.
- **No leak after unmount.** `disposeSubtree` (`reactive.ts`) nulls `owner` and clears `children`,
  so the whole subtree is collectable.

**No pathological growth in the 50–200 range; no follow-up fix issue required.**

### Known boundary (out of scope for #1373)

`disposeSubtree` and the mount walk are recursive, so reactive-scope nesting is bounded by the JS
call-stack: depth ~10,000 is fine, ~20,000 throws `Maximum call stack size exceeded`. This is two
orders of magnitude beyond the issue's 50–200 target. If arbitrarily deep nesting ever becomes a
real requirement, converting the disposal recursion to an explicit work-list removes the limit.
