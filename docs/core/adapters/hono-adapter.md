---
title: Hono Adapter
description: Generate Hono JSX templates from the compiler's IR for Hono-based servers.
---

# Hono Adapter

The Hono adapter generates Hono JSX (`.hono.tsx`) files from the compiler's IR. It is designed for Hono-based servers and any JSX-compatible TypeScript backend.

```
npm install @barefootjs/hono
```


## Basic Usage

```typescript
import { compile } from '@barefootjs/jsx'
import { HonoAdapter } from '@barefootjs/hono'

const adapter = new HonoAdapter()
const result = compile(source, { adapter })

// result.template  → .hono.tsx file content
// result.clientJs  → .client.js file content
```


## Options

```typescript
const adapter = new HonoAdapter({
  clientJsBasePath: '/static/components/',
  barefootJsPath: '/static/components/barefoot.js',
  clientJsFilename: 'my-component.client.js',
})
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `clientJsBasePath` | `string` | `'/static/components/'` | Base path for client JS files |
| `barefootJsPath` | `string` | `'/static/components/barefoot.js'` | Path to the BarefootJS runtime |
| `clientJsFilename` | `string` | `'{componentName}.client.js'` | Override the client JS filename |


## Output Format

### Server Component

A server-only component (no `"use client"`) produces a plain Hono JSX function:

**Source:**

```tsx
export function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>
}
```

**Output (.hono.tsx):**

```tsx
export function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>
}
```

No hydration markers, no client JS.

### Client Component

A client component produces a Hono JSX function with hydration markers and props serialization:

**Source:**

```tsx
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial)

  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
    </div>
  )
}
```

**Output (.hono.tsx):**

```tsx
export function Counter({ initial = 0, __instanceId, __bfScope }: CounterPropsWithHydration) {
  const __scopeId = __instanceId || `Counter_${Math.random().toString(36).slice(2, 8)}`
  const count = () => initial ?? 0
  const setCount = () => {}

  return (
    <div bf-s={__scopeId} {...(__bfPropsJson ? { "bf-p": __bfPropsJson } : {})}>
      <p bf="slot_0">{count()}</p>
      <button bf="slot_1">+1</button>
    </div>
  )
}
```

Key aspects of the output:

- **`bf-s`** on the root element identifies the component boundary
- **`bf="slot_N"`** marks elements that the client JS will target
- **Signal stubs** (`count = () => initial ?? 0`) allow the template to render the initial value server-side
- **`bf-p`** attribute serializes props as JSON for client-side hydration
- **Event handlers are removed** — they exist only in the client JS


## Script Collection

Script collection is handled as a build-time post-processing step. After compiling with HonoAdapter, the build script injects `useRequestContext()` calls into the generated marked templates to register client scripts during SSR.

At the end of the page, the `BfScripts` component renders the collected `<script>` tags:

```tsx
import { BfScripts } from '@barefootjs/hono'

export function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BfScripts />
      </body>
    </html>
  )
}
```

This ensures each component's client JS is loaded exactly once, even if the component appears multiple times on the page. See `site/ui/build.ts` for the `addScriptCollection()` implementation pattern.


## Hydration Props

The adapter extends every client component's props with hydration-related fields:

| Prop | Purpose |
|------|---------|
| `__instanceId` | Unique instance identifier passed from the parent |
| `__bfScope` | Parent's scope ID (for nested component communication) |
| `__bfChild` | Marks this component as a child instance (adds `~` prefix to `bf-s` value) |
| `data-key` | Stable key for list-rendered instances |

These props are used internally by the hydration system and do not need to be passed manually when using components.


## Conditional Rendering

Ternary expressions in JSX compile to conditional output with hydration markers:

**Source:**

```tsx
{isActive() ? <span>Active</span> : <span>Inactive</span>}
```

**Output:**

```tsx
{isActive() ? <span bf-c="slot_2">Active</span> : <span bf-c="slot_2">Inactive</span>}
```

The client JS uses the `bf-c` marker to swap DOM nodes when the condition changes.


## Loop Rendering

Array `.map()` calls compile to JSX map expressions:

**Source:**

```tsx
{items().map(item => <li>{item.name}</li>)}
```

**Output:**

```tsx
{items().map(item => <li>{item.name}</li>)}
```

For loops with child components, the adapter generates unique instance IDs per iteration using the loop index or a `key` prop.
