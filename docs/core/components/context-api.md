---
title: Context API
description: Share state with deeply nested children without prop drilling using createContext and useContext.
---

# Context API

Context lets a parent component share state with deeply nested children without passing props through every level. It is the foundation of compound component patterns like Dialog, Accordion, and Tabs.

```tsx
import { createContext, useContext } from '@barefootjs/dom'
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

Provides a value to all descendant components. Any component inside the provider tree can read the value with `useContext`.

```tsx
<MyContext.Provider value={someValue}>
  {props.children}
</MyContext.Provider>
```

The compiler transforms `<Context.Provider>` into an internal `provideContext()` call. At runtime, the value is set synchronously before children initialize, so `useContext` always sees the provided value.


## `useContext`

Reads the current value from a context.

```tsx
const value = useContext(MyContext)
```

**Behavior:**

- If a `Provider` ancestor exists, returns the provided value
- If no `Provider` exists and a default value was passed to `createContext`, returns the default
- If no `Provider` exists and no default was set, throws an error


## Basic Example

```tsx
"use client"
import { createContext, useContext } from '@barefootjs/dom'

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

Context is most commonly used for compound components — a group of related components that share internal state. The root component provides the state; sub-components consume it.

### Example: Accordion

```tsx
"use client"
import { createSignal, createContext, useContext, createEffect } from '@barefootjs/dom'

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

Context values can contain signal getters. When a child component reads a signal getter from context inside a `createEffect`, the effect re-runs when the signal changes:

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

The signal getter `ctx.activeItem()` is called inside the effect, so the effect subscribes to `activeItem`. When `activeItem` changes (via `toggle`), only the affected effects re-run.


## Context Without a Default

When `createContext` is called without a default value, `useContext` throws if no `Provider` ancestor is found. This is the recommended pattern for compound components where a provider is always expected:

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

This catches composition errors early. If a sub-component is accidentally used outside its parent, the error message identifies the missing provider.


## Context With a Default

When a default is provided, `useContext` always succeeds:

```tsx
const ThemeContext = createContext<'light' | 'dark'>('light')

// Works even without a ThemeProvider ancestor — returns 'light'
const theme = useContext(ThemeContext)
```

Use this pattern for optional contexts where a sensible fallback exists.
