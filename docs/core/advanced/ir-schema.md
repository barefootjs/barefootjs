---
title: IR Schema Reference
description: JSON tree structure of the Intermediate Representation consumed by adapters and client-JS generation.
---

# IR Schema Reference

The Intermediate Representation (IR) is a pure JSON tree structure that sits between JSX parsing and template/client-JS generation. It is **JSX-independent** — adapters consume IR without any knowledge of the original JSX syntax.

## Pipeline Position

```
JSX Source → [Phase 1: analyzer + jsx-to-ir] → IR → [Phase 2a: adapter] → Template
                                                   → [Phase 2b: ir-to-client-js] → Client JS
```

## Source

The IR type definitions live in [`packages/jsx/src/types.ts`](../../../packages/jsx/src/types.ts). All node types, attributes, and metadata are defined in this file.

Key node types:

| Type | Description |
|------|-------------|
| `IRElement` | HTML/SVG element |
| `IRText` | Static text |
| `IRExpression` | Dynamic expression (`{braces}`) |
| `IRConditional` | Branching via ternary or logical expressions |
| `IRLoop` | List rendering via `.map()` (including filter/sort) |
| `IRComponent` | Child component reference |
| `IRFragment` | JSX fragment (`<>...</>`) |
| `IRIfStatement` | Early return within a component body |
| `IRProvider` | Context Provider |

---

## Hydration Markers

The `slotId` and `needsScope` fields in the IR map to HTML attributes in the rendered template:

| IR Field | HTML Output | Purpose |
|----------|------------|---------|
| `needsScope: true` | `bf-s="ComponentName"` | Component root boundary |
| `slotId: "0"` | `bf="0"` | Reference for interactive elements |
| Conditional `slotId` | `bf-c="1"` | Anchor for conditional branches |

The client runtime uses these markers to locate elements that need hydration without a full DOM traversal.

---

## Debugging

Pass `outputIR: true` to output the IR as JSON:

```typescript
import { compileJSXSync } from '@barefootjs/jsx'

const result = compileJSXSync(source, 'Counter.tsx', {
  adapter: new HonoAdapter(),
  outputIR: true,
})

// result.ir contains the full ComponentIR
console.log(JSON.stringify(result.ir, null, 2))

// result.additionalFiles includes the *.ir.json file
// e.g., { path: 'Counter.ir.json', content: '...' }
```
