# @barefootjs/xyflow

Signal-based wrapper around [@xyflow/system](https://www.npmjs.com/package/@xyflow/system) for BarefootJS.
Provides graph editor primitives (Flow, Background, Controls, Handle,
NodeWrapper, MiniMap, Edge) with both an imperative `init*` API and
JSX-native `"use client"` components.

## Source layout

```
src/
├── index.ts                    re-exports the public API
├── flow.ts                     imperative initFlow + container DOM
├── background.ts               imperative initBackground
├── controls.ts                 imperative initControls
├── handle.ts                   imperative initHandle / createHandle
├── node-wrapper.ts             imperative createNodeWrapper / createNodeRenderer
├── edge-renderer.ts            imperative createEdgeRenderer (per-edge createRoot)
├── minimap.ts                  imperative initMiniMap
├── connection.ts               pointer-paced — stays imperative
├── selection.ts                pointer-paced — stays imperative
├── node-resizer.ts             pointer-paced — stays imperative
├── compat.ts                   React Flow API shim (no DOM)
├── store.ts / hooks.ts / context.ts / types.ts / constants.ts / utils.ts
├── edge-path.ts                geometry helpers shared between imperative + JSX
└── components/                 JSX-native counterparts (#1081)
    ├── flow.tsx
    ├── background.tsx
    ├── controls.tsx
    ├── handle.tsx
    ├── node-wrapper.tsx
    ├── minimap.tsx
    └── simple-edge.tsx
```

### Why JSX components live under `src/components/` (not `src/`)

`packages/xyflow/src/index.ts` re-exports the imperative API with
**bare specifiers** (`from './background'`, `from './controls'`, ...).
With both `background.ts` and `background.tsx` present in the same
directory, Bun's resolver may pick the `.tsx` file for a bare specifier.
That pulls `@barefootjs/jsx/jsx-dev-runtime` (a types-only subpath
exported as `.d.ts` only) into Bun's bundler graph, and the build fails:

```
error: Could not resolve: "../jsx-runtime"
    at packages/jsx/src/jsx-dev-runtime/index.d.ts:7:21
```

Two structural fixes were considered:

1. **Add explicit `.ts` extensions in `index.ts`** (`from './background.ts'`).
   Works for `bun build`, but `tsc` / `tsgo` do not rewrite `.ts` to `.js`
   in declaration output even with `rewriteRelativeImportExtensions: true`
   under `moduleResolution: "bundler"`. Consumers would get
   `dist/index.d.ts` containing `from './flow.ts';` and reject it.
2. **Move JSX files into `src/components/`** so the bare specifiers in
   `index.ts` always resolve to a `.ts` file unambiguously. No
   resolver-priority dependency, no consumer-side fallout.

We use approach 2. The directory boundary is the contract:

- **`src/*.ts`** — imperative entry points, owned by `index.ts`.
- **`src/components/*.tsx`** — JSX-native components, **not yet exported**
  from `index.ts`. The runtime cutover that swaps the `init*` callers
  for `<Flow>` lives in a follow-up to #1081 and will decide the public
  re-export shape (e.g. `import { Flow } from '@barefootjs/xyflow'` vs
  a separate `@barefootjs/xyflow/components` subpath).

When adding a new JSX-native component:

- Place the `.tsx` file under `src/components/`.
- Place its IR test under `src/__tests__/` and read the source via
  `readFileSync(resolve(__dirname, '../components/<name>.tsx'), ...)`.
- Do **not** colocate a `.tsx` next to its `.ts` namesake under `src/`
  unless `src/index.ts` is updated to disambiguate.

## Imperative subsystems that stay imperative

Per the #1081 migration plan, three subsystems are deliberately kept
imperative — JSX bindings give them no leverage:

- **`connection.ts`** — pointer capture + temporary preview path +
  `elementFromPoint` hit-testing. Lifecycle-bound to a pointer cycle,
  not a reactive signal.
- **`selection.ts`** — global pointer capture, drag-rect math,
  viewport hit-testing.
- **`node-resizer.ts`** — pointer capture + dimension math + heavy
  DOM measurement.

These attach to JSX components via `ref` callbacks at the cutover.

## See also

- Issue #1081 — JSX-native migration plan (steps 1-8).
- PR #1078 — per-edge `createRoot` PoC (translation target for
  `<SimpleEdge>`).
- Issue #1080 — chart JSX migration (parallel effort, different
  package layout choice: chart utilities in `packages/chart`, JSX in
  `ui/components/ui/chart/`).
