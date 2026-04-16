---
title: Fine-grained Reactivity
description: Signal-based reactivity with signals, effects, and memos — no virtual DOM needed
---

# Fine-grained Reactivity

In React, changing a single piece of state re-renders the component and its entire subtree. The virtual DOM then diffs the old and new trees to find what actually changed. This works, but it's work the browser does on every update — even when only one text node needs to change.

BarefootJS takes a different approach. **The compiler statically analyzes which DOM nodes depend on which signals, and wires them together at build time.** When a signal changes, only the exact DOM nodes that use it update. No diffing, no component re-render, no virtual DOM.

This is inspired by [SolidJS](https://www.solidjs.com/). If you've used SolidJS, the API will feel familiar. If you're coming from React or Vue, the key difference is: **components run once, not on every state change.**

The core primitives are **signals**, **effects**, and **memos**. All reactive getters carry the `Reactive<T>` phantom brand — a compile-time marker that enables the compiler to detect reactivity via TypeScript's type system. The brand has no runtime cost.

## Signals

A signal holds a reactive value. It returns a getter/setter pair:

```tsx
const [count, setCount] = createSignal(0)

count()              // Read: returns 0
setCount(5)          // Write: set to 5
setCount(n => n + 1) // Write: updater function
```

The getter is a **function call** — `count()`, not `count`. This is how the reactivity system tracks dependencies. The getter is typed as `Reactive<() => T>`.

## Effects

An effect runs a function whenever its signal dependencies change:

```tsx
createEffect(() => {
  console.log('Count is:', count())
})
```

The system records that `count` was read. When `count` changes, the effect re-runs. No dependency array is needed.

## Memos

A memo is a cached derived value:

```tsx
const doubled = createMemo(() => count() * 2)

doubled() // Returns the cached result
```

Like effects, memos track dependencies automatically. Unlike effects, they return a value and only recompute when dependencies change.

## Update Flow

Here's what happens when a signal changes — compared with the virtual DOM approach:

**Virtual DOM (React):**
```
setState(1) → re-run component function → generate new virtual tree
→ diff old vs new → find changed nodes → patch DOM
```

**Signals (BarefootJS):**
```
setCount(1) → signal notifies subscribers → effect updates DOM node directly
```

No intermediate representation at runtime. No tree walk. The signal knows exactly which DOM node to update because the compiler wired them together at build time:

```
setCount(1)
    ↓
Signal notifies subscribers
    ↓
Effect re-runs: _s0.nodeValue = String(count())
    ↓
Only that text node updates. The rest of the DOM is untouched.
```

For the full API reference, see [Reactivity](../reactivity.md).
