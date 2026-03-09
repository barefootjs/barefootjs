---
title: Component Authoring
description: Learn how to write server and client components in BarefootJS using JSX functions.
---

# Component Authoring

A BarefootJS component is a function that returns JSX. Components come in two kinds: **server components** and **client components**.


## Server Components

A server component renders HTML on the server. It has no client-side JavaScript.

```tsx
export function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>
}
```

Server components can access databases, read files, use secrets — anything that should stay on the server. They produce a template that is rendered once per request.


## Client Components

A client component uses reactive primitives and ships JavaScript to the browser. It requires the `"use client"` directive at the top of the file:

```tsx
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter({ initial = 0 }) {
  const [count, setCount] = createSignal(initial)

  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
    </div>
  )
}
```

The compiler produces two outputs from this source:

1. **Marked Template** — Server-rendered HTML with `bf-*` attributes
2. **Client JS** — A minimal script that creates signals, binds effects, and attaches event handlers

See [Core Concepts — Two-Phase Compilation](../core-concepts.md#two-phase-compilation) for details.

### When `"use client"` Is Required

Add `"use client"` when a component uses any of these:

- `createSignal`, `createEffect`, `createMemo`
- `onMount`, `onCleanup`, `untrack`
- `createContext`, `useContext`
- Event handlers (`onClick`, `onChange`, etc.)

Without the directive, the compiler emits an error:

```
error[BF001]: 'use client' directive required for components with createSignal
```


## Component Naming

Component names must start with an uppercase letter. This is how the compiler distinguishes components from HTML elements:

```tsx
// ✅ Component
function TodoItem() { ... }

// ❌ Error BF042
function todoItem() { ... }
```


## Compilation Output

A client component compiles into a marked template and a client init function. Here is a minimal example to illustrate the full pipeline:

**Source:**

```tsx
"use client"
import { createSignal } from '@barefootjs/dom'

export function Toggle() {
  const [on, setOn] = createSignal(false)

  return (
    <button onClick={() => setOn(v => !v)}>
      {on() ? 'ON' : 'OFF'}
    </button>
  )
}
```

**Marked template (Hono):**

<!-- tabs:adapter -->
<!-- tab:Hono -->
```tsx
export function Toggle() {
  return (
    <button bf-s="Toggle" bf="slot_0">
      OFF
    </button>
  )
}
```
<!-- tab:Go Template -->
```go-template
{{define "Toggle"}}
<button bf-s="{{.ScopeID}}" bf="slot_0">
  OFF
</button>
{{end}}
```
<!-- /tabs -->

**Client JS:**

```js
import { createSignal, createEffect, $, hydrate } from '@barefootjs/dom'

export function initToggle(__scope, props = {}) {
  const [on, setOn] = createSignal(false)

  const _s0 = $(__scope, 's0')

  createEffect(() => {
    if (_s0) _s0.textContent = on() ? 'ON' : 'OFF'
  })

  if (_s0) _s0.onclick = () => setOn(v => !v)
}

hydrate('Toggle', { init: initToggle })
```

The server renders static HTML. The browser runs the init function to make it interactive. Only the specific text node bound to `on()` updates when the signal changes.


## Composition Rules

Server and client components follow a one-way composition rule:

| From | To | Allowed |
|------|----|---------|
| Server component | Server component | ✅ |
| Server component | Client component | ✅ |
| Client component | Client component | ✅ |
| Client component | Server component | ❌ |

A client component cannot import a server component because server-only code does not exist in the browser. The compiler emits error `BF003` if this is attempted.

```tsx
// Page.tsx — server component
import { Counter } from './Counter'    // "use client" ✅
import { UserList } from './UserList'  // server-only  ✅

export function Page() {
  return (
    <div>
      <UserList />   {/* Server → Server */}
      <Counter />    {/* Server → Client */}
    </div>
  )
}
```

```tsx
// Dashboard.tsx — "use client"
import { Counter } from './Counter'    // ✅ Client → Client
import { UserList } from './UserList'  // ❌ BF003: Client → Server
```

Think of `"use client"` as a one-way gate: once you cross into client territory, everything below must also be a client component.


## Ref Callbacks

Client components use `ref` callbacks for imperative DOM access. The callback receives the DOM element after it is mounted:

```tsx
"use client"
import { createEffect } from '@barefootjs/dom'

export function AutoFocus() {
  const handleMount = (el: HTMLInputElement) => {
    el.focus()
  }

  return <input ref={handleMount} placeholder="Focused on mount" />
}
```

Ref callbacks are the primary mechanism for attaching side effects to specific elements. They are often combined with `createEffect` for reactive DOM updates:

```tsx
const handleMount = (el: HTMLElement) => {
  createEffect(() => {
    el.className = isActive() ? 'active' : 'inactive'
  })
}
```
