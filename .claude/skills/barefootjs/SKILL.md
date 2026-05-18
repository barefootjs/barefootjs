---
name: barefootjs
description: "Build, inspect, and debug UI components using the bf CLI. Use when: creating/editing/reviewing components, investigating signal dependencies, debugging reactive updates, scaffolding new components, or looking up component APIs."
---
# Component Development Skill

Build UI components using the `bf` CLI for component discovery, scaffolding, testing, and signal inspection.

## Workflow

1. `bun run bf search <query>` — Find components and docs by name/category/tags
2. `bun run bf docs <component>` — Get props, examples, accessibility info
3. `bun run bf guide <topic>` — Read framework docs (signals, compiler constraints, etc.)
4. `bun run bf gen component <name> <comp...>` — Generate skeleton + basic IR test
5. Implement the component
6. `bun test <path>` — Verify compilation
7. `bun run bf gen test <name>` — Regenerate richer IR test
8. `bun test <path>` — Final verification
9. Create previews and run `bun run bf preview <name>` — Visual preview in browser
10. Ask the user to check `http://localhost:3003` in the browser for visual/interaction verification

## Signal Inspection & Debugging

Use these commands to understand and debug a component's reactive structure **without running any code**. All analysis is static (from IR).

### `bun run bf debug graph <component>`

Show the signal dependency graph for a component. Use this **before modifying** a stateful component to understand its reactive structure: which signals exist, what memos depend on them, and which DOM nodes are bound.

- Add `--json` for machine-readable output.
- Example: `bun run bf debug graph combobox`

### `bun run bf debug trace <component> <signal|memo>`

Reverse-lookup: trace the full propagation path from a signal/memo to every DOM binding it affects. Use this to answer "why does this DOM node update?" or to verify that a signal change reaches the expected targets.

- If the signal name is wrong, the CLI lists available signals/memos.
- Add `--json` for machine-readable output.
- Example: `bun run bf debug trace combobox open`

### `bun run bf debug signals <component>`

Show a signal initialization trace: every signal, its initial value, and its effect bindings. Useful for verifying that signals are wired correctly in a newly written or modified component.

- Add `--json` for machine-readable output.
- Example: `bun run bf debug signals select`

### `bun run bf debug fallbacks <component>`

Surface fallback-wrapped expressions emitted by Solid-style wrap-by-default (#937). Use this to find candidates for `createMemo` refactor — places where the compiler couldn't statically prove reactivity and fell back to wrapping.

- Add `--json` for machine-readable output.
- Example: `bun run bf debug fallbacks combobox`

### When to use inspection

- **Before editing a stateful component** — run `debug graph` to map the reactive graph.
- **Unexpected re-renders or missing updates** — run `debug trace` to trace propagation.
- **After implementing a new component** — run `debug signals` to verify signal wiring.
- **Reviewing a PR** — run `debug graph --json` to diff the dependency graph before/after.

## Previews

Previews provide visual preview with full hydration support.

### File location

`ui/components/ui/__previews__/<name>.previews.tsx`

### Format

Each `export function` becomes a separate preview. PascalCase names are auto-converted to display titles (e.g., `WithLabel` → "With Label").

```tsx
"use client"

import { ComponentName } from '../component-name'

/** Default usage */
export function Default() {
  return <ComponentName />
}

/** Show a specific variant or state */
export function WithProps() {
  return <ComponentName variant="outline" disabled />
}
```

### Guidelines

- Always include a `Default` preview showing basic usage.
- Add previews for key variants, states, and compositions (e.g., `WithLabel`, `Disabled`, `PreFilled`).
- Previews that use signals need `"use client"` at the top.
- Import components via relative path from `../` (e.g., `import { Button } from '../button'`).
- After creating previews, run `bun run bf preview <name>` and ask the user to verify in the browser.

## Rules

- Use `bf search` and `bf docs` for component discovery. Do not read source files to learn component APIs.
- Use `bf guide error-codes` to check compiler constraints (BF001, BF021, etc.) before writing components.
- New components go in `ui/components/ui/<name>.tsx`.
- IR tests go in `ui/components/ui/__tests__/<name>.test.ts`.
- Stateful components (using signals) must have `"use client"` as the first line.
- Stateful components must use `props.xxx` (not destructuring) to maintain reactivity.
- Use `createSignal`, `createMemo`, `createEffect` from `@barefootjs/client` (SolidJS-style, not React hooks).
- Use `for` attribute on `<Label>` (not `htmlFor`).
- Event handlers have typed `e.target` — write `onInput={e => setValue(e.target.value)}` directly. Do not cast with `as HTMLInputElement`.
- Use `className` in JSX (not `class`). `class` is a JS reserved keyword.
- Signal getters must be called in JSX: `value={name()}` (not `value={name}`).
