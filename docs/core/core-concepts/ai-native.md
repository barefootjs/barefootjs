---
title: AI-native Development
description: Millisecond component tests via IR, CLI-driven component discovery
---

# AI-native Development

`renderToTest()` verifies component structure, signals, events, and accessibility against the compiler's IR — in milliseconds, without a browser. Real interactions and visual behavior still need E2E tests, but structural issues are caught before you get there:

```tsx
import { renderToTest } from '@barefootjs/test-utils'

test('Counter has a button with click handler', () => {
  const ir = renderToTest(<Counter />)

  expect(ir).toContainElement('button')
  expect(ir).toHaveEventHandler('click')
  expect(ir).toHaveSignal('count', { initialValue: 0 })
})
```

See [IR Schema Reference](../advanced/ir-schema.md) for the full specification.

## CLI for AI Workflows

The `bf` CLI provides structured access to discovery, scaffolding, and debugging. All commands support `--json` for machine-readable output.

```bash
# Discover
bf search dialog              # Find by name/category/tags
bf docs accordion             # Props, examples, a11y
bf guide signals              # Framework docs

# Scaffold
bf gen component settings-form input switch button  # Component skeleton + IR test
bf gen test Button                                  # Generate IR test from existing source

# Inspect reactive structure
bf debug graph Counter           # Signal dependency graph
bf debug trace Counter count     # Trace update path: signal → DOM
bf debug fallbacks calendar      # List Solid-style wrap-by-default fallback bindings
bf debug signals Counter         # Show signal initialization trace
```

Both humans and AI agents use these commands to generate and debug components without reading source files.
