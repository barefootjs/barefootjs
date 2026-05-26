---
title: Context API
description: Share state with deeply nested children without prop drilling using createContext and useContext.
---

# Context API

Context shares state with deeply nested children without prop drilling. It is the foundation of compound components (Dialog, Accordion, Tabs).

```tsx
"use client"
import { createContext, useContext } from '@barefootjs/client'
```


## `createContext`

Creates a new context with an optional default value.

```tsx
const MyContext = createContext<T>(defaultValue?: T)
```

**Type:**

```tsx
type Context<T> = {
  readonly id: symbol
  readonly defaultValue: T | undefined
  readonly Provider: (props: { value: T; children?: unknown }) => unknown
}
```


## `Context.Provider`

Provides a value to all descendants. Components inside the provider tree read it with `useContext`.

```tsx
<MyContext.Provider value={someValue}>
  {props.children}
</MyContext.Provider>
```

The compiler transforms this into a `provideContext()` call. The value is set synchronously before children initialize.


## `useContext`

Reads the current value from a context.

```tsx
const value = useContext(MyContext)
```

**Behavior:**

- If a `Provider` ancestor exists, returns the provided value
- If no `Provider` exists and a default value was passed to `createContext`, returns the default
- Otherwise returns `undefined` — guard with optional chaining (`store?.value`)


## Basic Example

```tsx
"use client"
import { createContext, useContext } from '@barefootjs/client'

// 1. Create the context
const ThemeContext = createContext<'light' | 'dark'>('light')

// 2. Provider component
export function ThemeProvider(props: { theme: 'light' | 'dark'; children?: Child }) {
  return (
    <ThemeContext.Provider value={props.theme}>
      {props.children}
    </ThemeContext.Provider>
  )
}

// 3. Consumer component
export function ThemedButton(props: { children?: Child }) {
  const handleMount = (el: HTMLButtonElement) => {
    const theme = useContext(ThemeContext)
    el.className = theme === 'dark' ? 'btn-dark' : 'btn-light'
  }

  return <button ref={handleMount}>{props.children}</button>
}
```

```tsx
// Usage
<ThemeProvider theme="dark">
  <ThemedButton>Click me</ThemedButton>  {/* Gets dark styling */}
</ThemeProvider>
```


## Compound Components

A group of related components sharing internal state. The root provides state; sub-components consume it.

### Example: Accordion

```tsx
"use client"
import { createSignal, createContext, useContext, createEffect } from '@barefootjs/client'

// Context type
interface AccordionContextValue {
  activeItem: () => string | null
  toggle: (id: string) => void
}

// Create context
const AccordionContext = createContext<AccordionContextValue>()

// Root component — provides state
function Accordion(props: { children?: Child }) {
  const [activeItem, setActiveItem] = createSignal<string | null>(null)

  const toggle = (id: string) => {
    setActiveItem(prev => prev === id ? null : id)
  }

  return (
    <AccordionContext.Provider value={{ activeItem, toggle }}>
      <div data-slot="accordion">{props.children}</div>
    </AccordionContext.Provider>
  )
}

// Trigger — toggles the active item
function AccordionTrigger(props: { itemId: string; children?: Child }) {
  const handleMount = (el: HTMLButtonElement) => {
    const ctx = useContext(AccordionContext)

    el.addEventListener('click', () => {
      ctx.toggle(props.itemId)
    })

    createEffect(() => {
      const isOpen = ctx.activeItem() === props.itemId
      el.setAttribute('aria-expanded', String(isOpen))
    })
  }

  return <button ref={handleMount}>{props.children}</button>
}

// Content — shows/hides based on active item
function AccordionContent(props: { itemId: string; children?: Child }) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(AccordionContext)

    createEffect(() => {
      const isOpen = ctx.activeItem() === props.itemId
      el.hidden = !isOpen
    })
  }

  return <div ref={handleMount}>{props.children}</div>
}
```

**Usage:**

```tsx
<Accordion>
  <AccordionTrigger itemId="faq-1">What is BarefootJS?</AccordionTrigger>
  <AccordionContent itemId="faq-1">
    <p>A JSX-to-template compiler with signal-based reactivity.</p>
  </AccordionContent>

  <AccordionTrigger itemId="faq-2">How does hydration work?</AccordionTrigger>
  <AccordionContent itemId="faq-2">
    <p>Marker-driven: bf-* attributes tell the client JS where to attach.</p>
  </AccordionContent>
</Accordion>
```


## Reactive Context Values

Context values can contain signal getters. Effects that read them re-run when the signal changes:

```tsx
// Provider passes signal getter
<AccordionContext.Provider value={{ activeItem, toggle }}>
```

```tsx
// Consumer reads inside createEffect — reactive
const ctx = useContext(AccordionContext)
createEffect(() => {
  const isOpen = ctx.activeItem() === props.itemId  // Tracks activeItem signal
  el.hidden = !isOpen
})
```

`ctx.activeItem()` inside the effect subscribes to `activeItem`. When it changes, only affected effects re-run.


## Context Without a Default

Without a default value, `useContext` throws if no `Provider` ancestor exists. Recommended for compound components:

```tsx
const DialogContext = createContext<DialogContextValue>()

// If DialogTrigger is used outside a Dialog, useContext throws
function DialogTrigger(props: { children?: Child }) {
  const handleMount = (el: HTMLElement) => {
    const ctx = useContext(DialogContext) // Throws if no Dialog ancestor
    // ...
  }
  return <button ref={handleMount}>{props.children}</button>
}
```

This catches composition errors early — the error identifies the missing provider.


## Context With a Default

With a default, `useContext` always succeeds:

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light')

// Works even without a ThemeProvider ancestor — returns 'light'
const theme = useContext(ThemeContext)
```

Use for optional contexts with a sensible fallback.


## Where It Works

`useContext` is a **browser-only API**. It runs during hydration, not on the server. Valid call sites:

| Location | Works? | Notes |
|----------|--------|-------|
| Inside `handleMount` (ref callback) | Yes | Most common pattern — recommended |
| Inside `onMount` | Yes | |
| Inside `createEffect` | Yes | |
| Component body level | Yes | Only in `"use client"` components — executes during client initialization |
| Module scope | No | No component context available |
| Server component body | No | SSR error — `useContext` is not available on the server |

The ref callback pattern (`handleMount`) is the **recommended convention** because it naturally places context access in the hydration phase and co-locates it with DOM setup. Body-level calls work but can't drive JSX expressions directly — use them when you need the context value in `createMemo` or `createEffect`.


## Compilation Unit Scope

Context is scoped to a **single compilation unit** — one `.tsx` file that compiles into one `.client.js` bundle.

This means:

- `createContext()` and all its consumers **must live in the same file**
- Each `.client.js` bundle gets its own `createContext()` call, producing a unique `Symbol` id
- If you import a context from another file, the consumer's bundle creates a *different* context object — `useContext` will never find the provider's value

This is why compound components (Accordion, Dialog, Select, Tabs) define all sub-components in a single file:

```tsx
// accordion/index.tsx — all in one file
"use client"

const AccordionContext = createContext<AccordionContextValue>()

function Accordion(props) { /* provides context */ }
function AccordionTrigger(props) { /* consumes context */ }
function AccordionContent(props) { /* consumes context */ }

export { Accordion, AccordionTrigger, AccordionContent }
```

For sharing reactive state across components in **separate files**, see [Shared State Patterns](../reactivity/shared-state.md).


## Common Mistakes

### Body-level `useContext` in a server component

```ts
// ❌ Missing "use client" — function body runs during SSR
export function Player(props: PlayerProps) {
  const ctx = useContext(MyContext)  // SSR error: useContext is browser-only
  // ...
}
```

Fix: add `"use client"` as the first line.

### Cross-file context import

```ts
// ❌ context.tsx
"use client"
export const PlaybackContext = createContext<PlaybackValue>()
export const usePlayback = () => useContext(PlaybackContext)

// ❌ player.tsx — different compilation unit
"use client"
import { usePlayback } from './context'
// The compiler inlines a NEW createContext() call in player.client.js
// → different Symbol id → useContext returns undefined
```

Fix: put the provider and all consumers in the **same file**, or use [custom events / module-level signals](../reactivity/shared-state.md) for cross-file communication.

### Cross-file `src/` utility with `useContext`

```ts
// ❌ src/playback.ts — utility file
import { createContext, useContext } from '@barefootjs/client'
const PlaybackContext = createContext()
export const usePlayback = () => useContext(PlaybackContext)
```

When the compiler inlines `src/` utilities into each component bundle, each bundle gets its own `createContext()` call — producing separate context objects with different identities. `useContext` in one bundle can never find the value provided by another.

Fix: same as above — keep context within a single file, or use a different state-sharing pattern.
