# Tier B design — `.sort()` / `.toSorted()` lowering

Draft proposal for the next #1448 tracker entry. Not implementation, just a
design pass so the next PR has a clear shape to land. Reviewers: please
push back on Section 3 (IR shape) first — the trade-off there ripples
through everything else.

## 1. Where things stand today

Sort already has **partial** support, but the surface is asymmetric and
narrow:

| Adapter | Today | Where |
|---|---|---|
| Go | `bf_sort .Items "Field" "asc"` via `IRLoop.sortComparator` | `packages/adapter-go-template/runtime/bf.go:1076`, emit at `packages/adapter-go-template/src/adapter/go-template-adapter.ts:3886` |
| Mojo | **Nothing** — `renderLoop` ignores `sortComparator` | `packages/adapter-mojolicious/src/adapter/mojo-adapter.ts:538` |
| Hono / CSR | Native JS, no lowering needed | — |

Detection sits at the loop level: `isSortCall()` + `extractSortComparator()`
(`packages/jsx/src/jsx-to-ir.ts:1849–1951`) only fire when `.sort(...)` is
chained directly before `.map(...)`, optionally with `.filter(...)` in
between. The comparator shape accepted is narrow: arrow fn with two
parameters, expression body, `a.field - b.field` or `b.field - a.field`,
single matching field name on both sides, numeric subtraction only.

Anything else — standalone `arr.sort(...).join(',')`, primitive arrays
without a field accessor, string comparators (`localeCompare`),
multi-key chains (`a.x - b.x || a.y - b.y`) — falls through:

- In a `.sort().map()` chain, the comparator is silently kept as the JS
  source string and `extractSortComparator()` returns `null` →
  `sortComparator` stays `undefined` and Go just emits the unsorted
  array. **No user-visible diagnostic today.**
- Outside `.map()` (`{items.sort((a,b) => a.x - b.x)}`), the expression
  reaches `expression-parser.ts`'s call dispatcher. `sort` is **not** in
  `UNSUPPORTED_METHODS`, so the parser doesn't refuse it — the generic
  `call` arm emits something like `.Items.Sort` (Go) or
  `$items->{sort}` (Mojo) which fails at request time. **Silent.**

Both silent-failure paths are arguably worse than the BF101 refusals
Tier A graduated away from.

## 2. Goals for this PR

In priority order:

1. **Close Mojo's gap** — `.sort().map()` should work on Mojo, since
   that's the canonical use case ("sort items, then iterate") and it
   silently breaks today.
2. **Make standalone sort an explicit refusal or a real lowering** —
   not the current silent fallthrough. Pick one; this doc proposes
   lowering.
3. **Cover the comparator shapes the codebase already reaches for** —
   `(a, b) => a - b` on primitive arrays, `localeCompare` for strings,
   field-based subtractions. The exact set is in §4.
4. **Stay backward-compatible at the runtime helper layer** so existing
   templates emitted by old compiler versions don't break when the
   runtime helper signature changes.

Non-goals (deferred to a follow-up):

- Block-body comparators (`{ const x = a.foo; ... }`).
- Multi-key (`||`-chained) comparators.
- Custom function-reference comparators (`arr.sort(myComparator)`).
- Ternary comparators (`a.x > b.x ? 1 : -1`). The shape is expressive
  but the lowering surface and the worth-it ratio aren't great.

## 3. IR shape — the load-bearing decision

Two viable structures. The choice ripples through every other section.

### Option A: extend `IRLoop.sortComparator` only

Keep sort as a loop-level concern. Widen `SortComparatorResult` to
carry the new comparator variants:

```ts
type SortComparator = {
  // What to sort on:
  //   { kind: 'self' }              → primitive array, compare items directly
  //   { kind: 'field'; field }      → struct-field accessor
  key: { kind: 'self' } | { kind: 'field'; field: string }
  // How to compare:
  //   'numeric' → subtraction semantics (a - b)
  //   'string'  → localeCompare semantics
  type: 'numeric' | 'string'
  direction: 'asc' | 'desc'
  raw: string                          // for @client fallback
  method: 'sort' | 'toSorted'
}
```

Standalone `arr.sort(...)` outside a `.map()` chain stays unhandled →
needs to surface a BF101 (`sort` joins `UNSUPPORTED_METHODS`, escape
via `@client`).

**Pros:** smaller diff. Reuses the existing loop-emit hook on the Go
side. Touch only `jsx-to-ir.ts`, `bf.go`, two adapter `renderLoop`s.

**Cons:** users hitting `{items.sort(...)}` in non-loop position get a
BF101 with the only escape being `@client` — even for simple shapes
the helper could handle. Locks sort to "always inside `.map()`" forever.

### Option B: lift sort into the `array-method` IR

Treat `.sort()` / `.toSorted()` as a first-class `array-method`
variant, alongside `.includes` / `.indexOf` / etc. that landed in
#1457–#1465. The IR node carries the structured comparator:

```ts
// In packages/jsx/src/expression-parser.ts
| {
    kind: 'array-method'
    method: 'sort' | 'toSorted'
    object: ParsedExpr
    args: ParsedExpr[]                 // raw, for `@client` fallback
    comparator: SortComparator         // ← new; extracted at parse time
  }
```

The loop-level `IRLoop.sortComparator` becomes a derived shape: when
`jsx-to-ir.ts` sees `.sort(...).map(...)`, it pulls the
`SortComparator` off the `array-method` node and stashes it on the
loop for the existing chained-emit path. The standalone shape
(`{items.sort(...)}`) lowers via the adapter's `arrayMethod()`
emitter, which calls the same runtime helper.

**Pros:** uniform with the rest of Tier A. Same helper covers both
loop-chained and standalone positions. Future extensions (variadic
comparator combinators, etc.) land in one place.

**Cons:** larger diff. Two emit sites for sort: loop-chained vs
standalone — must agree on the runtime helper to keep output
consistent. Slight risk of forgetting one path.

### Recommendation: **Option B**

Two reasons:

1. The non-loop case is real. `{items.sort((a,b) => a.x - b.x)[0]}` (the
   "min by field" idiom) shows up in dashboard fixtures and currently
   silently breaks. A BF101 refusal would just push users to `@client`
   for a shape the helper can handle trivially.
2. Tier A established the pattern. Every other JS array method that
   lowers cleanly went through `array-method`. Sort being the odd one
   out is just historical accident — it shipped before `array-method`
   existed.

The cost (one extra emit site) is paid once and is straightforward
to test: the same `SortComparator` shape feeds both call sites, so a
shared assertion can pin them together.

## 4. Comparator shapes accepted at parse time

Defined as a finite catalogue so the extractor is total. Each shape
maps to one `SortComparator` value:

| JS source | `key` | `type` | `direction` |
|---|---|---|---|
| `(a, b) => a.field - b.field` | `{ kind: 'field', field: 'field' }` | `numeric` | `asc` |
| `(a, b) => b.field - a.field` | `{ kind: 'field', field: 'field' }` | `numeric` | `desc` |
| `(a, b) => a - b` | `{ kind: 'self' }` | `numeric` | `asc` |
| `(a, b) => b - a` | `{ kind: 'self' }` | `numeric` | `desc` |
| `(a, b) => a.field.localeCompare(b.field)` | `{ kind: 'field', field: 'field' }` | `string` | `asc` |
| `(a, b) => b.field.localeCompare(a.field)` | `{ kind: 'field', field: 'field' }` | `string` | `desc` |
| `(a, b) => a.localeCompare(b)` | `{ kind: 'self' }` | `string` | `asc` |
| `(a, b) => b.localeCompare(a)` | `{ kind: 'self' }` | `string` | `desc` |

The accepted set is intentionally narrow so the extractor stays
shallow (no constant folding, no symbol resolution). Anything outside
this set falls back to the catch-all:

- If `array-method` lowering is in play (Option B above) → emit BF101
  with the unsupported-reason string and suggest `@client`. Mirrors
  the `extractFilterPredicate` refusal pattern.
- If we keep the silent fall-through behavior for `.sort().map()` so
  pre-Tier-B templates don't suddenly start refusing things they
  ignored before → emit a `BF105`-class warning (new code, severity
  `warning`) saying "sort comparator not lowered, array iterated
  unsorted". Pick one based on review preference; the current silent
  unsorted behavior should not survive this PR either way.

## 5. Runtime helper redesign

The existing `bf_sort(items, field, direction)` (Go) can't carry
`key.kind === 'self'` or `type === 'string'` — its signature is
already exhausted. Two compatible widenings:

### Go: variadic, backward-compatible

```go
// Sort lowers Array.prototype.sort / toSorted with a structured
// comparator. Accepts the legacy 3-arg numeric-field call shape
// (pre-#1448-Tier-B compilers) and the new 4-arg shape that
// carries the key kind + compare type.
func Sort(items any, args ...string) []any {
    var (
        keyKind, key, compareType, direction string
    )
    switch len(args) {
    case 2:
        // Legacy: field, direction. Defaults to numeric/field.
        keyKind, key, compareType, direction = "field", args[0], "numeric", args[1]
    case 4:
        keyKind, key, compareType, direction = args[0], args[1], args[2], args[3]
    default:
        return nil
    }
    // ... existing reflect-based sort, but branch on keyKind for
    //     accessor (self vs field) and compareType (numeric vs string).
}
```

Template emits:
- New shape (any Tier B compiler): `bf_sort .Items "field" "Field" "numeric" "asc"`
- Legacy shape (pre-Tier-B compiler emitting against new runtime):
  `bf_sort .Items "Field" "asc"` keeps working

### Mojo: new helper, hash-ref opts

```perl
sub sort ($self, $recv, $opts = {}) {
    return [] unless ref($recv) eq 'ARRAY';
    my $key_kind    = $opts->{key_kind}    // 'self';
    my $key         = $opts->{key}         // '';
    my $compare_type = $opts->{compare_type} // 'numeric';
    my $direction   = $opts->{direction}   // 'asc';
    # ... ref()-based accessor + Schwartz-transform sort
    return \@sorted;
}
```

Template emits:
```
bf->sort($items, { key_kind => 'field', key => 'field', compare_type => 'numeric', direction => 'asc' })
```

The hash-ref opts keep the call site readable when six fields-with-
literal-keys would otherwise crowd it, and they leave room for a
future `nulls => 'first' | 'last'` knob without an arity change.

## 6. Loop-chained vs standalone emit

Both paths funnel through the same runtime helper. The split is purely
"where to place the helper call":

- **Chained** (`.sort(...).map(...)`): `IRLoop.array` is wrapped in the
  helper call, same shape as today. Existing Go test
  `'array prop with sort comparator'` keeps passing.
  ```
  Go:   {{range (bf_sort .Items "field" "Field" "numeric" "asc")}}…{{end}}
  Mojo: % for my $item (@{bf->sort($items, { ... })}) { … % }
  ```
- **Standalone** (`{items.sort(...)}` outside `.map()`): emit at the
  expression site via the adapter's `arrayMethod()` hook. Returns the
  same shape (a new array), so it composes with other array-method
  helpers downstream (`.join`, `.at`, `.slice`, etc.):
  ```
  Go:   bf_sort .Items "field" "Field" "numeric" "asc"
  Mojo: bf->sort($items, { ... })
  ```

Both emit sites read the same `SortComparator` value from the IR, so a
shared TypeScript helper can stringify it once and both call sites use
the result.

## 7. Tests / fixtures

Conformance fixtures to add under
`packages/adapter-tests/fixtures/methods/`:

- `array-sort-field-asc.ts` — `items.sort((a, b) => a.price - b.price).map(...)` (covers the existing happy path on Go; **new** on Mojo)
- `array-sort-field-desc.ts` — descending variant of above
- `array-sort-primitive-asc.ts` — `nums.sort((a, b) => a - b)` (NEW path, primitive numeric)
- `array-sort-primitive-desc.ts` — descending
- `array-sort-string-locale.ts` — `names.sort((a, b) => a.localeCompare(b))` (NEW string compare)
- `array-sort-standalone.ts` — `items.sort((a, b) => a.price - b.price)[0]` (NEW standalone position)

Negative fixtures (asserted via `expectedDiagnostics` on each adapter,
matching the Tier A pattern):

- `array-sort-block-body.ts` — block comparator → BF101
- `array-sort-multi-key.ts` — `a.x - b.x || a.y - b.y` → BF101
- `array-sort-mismatched-fields.ts` — `a.x - b.y` → BF101 (already
  refused by `extractSortComparator`, just pin it)

Per-adapter fixture-driven lowering pins follow the Tier A template —
one row per fixture in the existing `Tier A fixture-driven lowering
pins` block (renamed to `Tier A + B`), pinning the emitted
`bf_sort` / `bf->sort` call shape so a regression surfaces on every
host even when Go / Perl aren't installed.

## 8. Open questions for review

1. **Silent fall-through behavior**: today an unsupported comparator
   in a `.sort().map()` chain silently iterates unsorted. Should this
   PR migrate to BF101 (loud), BF105-warning (loud-but-non-fatal),
   or leave as-is for backward compatibility?
2. **`localeCompare` argument options**: JS's `localeCompare` accepts
   a locale + options object. The v1 catalogue above accepts only the
   zero-arg form. Does anyone actually use the locale-aware form in
   templates? If yes, the IR needs a `compareOpts` slot.
3. **Stable-sort guarantee**: Go's `sort.SliceStable` is stable; Perl's
   `sort` was made stable in 5.8. Worth documenting the guarantee
   anywhere user-facing?
4. **`bf_sort` legacy arity**: keep the 3-arg legacy shape forever,
   or set a deprecation horizon (e.g. drop in v0.2)? It's only a few
   lines of code so "forever" is fine, but it's noise in the helper.
5. **Block body deferment**: filter comparators support block bodies
   today via `IRLoop.filterPredicate.blockBody`. Sort doesn't yet.
   Worth landing block-body support in the same PR, or wait?
