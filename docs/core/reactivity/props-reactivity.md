---
title: Props Reactivity
description: How prop access patterns determine whether reactive updates propagate in BarefootJS components.
---

# Props Reactivity

Props in BarefootJS can be reactive. The compiler wraps dynamic prop expressions in getters, so **how you access props determines whether updates propagate**.


## Direct Access — Reactive

Accessing props via `props.xxx` maintains reactivity. Each access calls the underlying getter:

```tsx
function Display(props: { value: number }) {
  createEffect(() => {
    console.log(props.value) // Re-runs when parent updates value
  })
  return <span>{props.value}</span>
}
```


## Destructuring — Captures Once

Destructuring calls the getter immediately and stores the result. The value is captured at that moment and does not update:

```tsx
function Display({ value }: { value: number }) {
  createEffect(() => {
    console.log(value) // Stale — captured at component init
  })
  return <span>{value}</span>
}
```

The compiler emits a warning (`BF043`) when it detects props destructuring in a client component, since this is a common source of bugs:

```
warning[BF043]: Props destructuring breaks reactivity

  --> src/components/Display.tsx:1:18
   |
 1 | function Display({ value }: { value: number }) {
   |                  ^^^^^^^^^
   |
   = help: Access props via `props.value` to maintain reactivity
```

If you intentionally want to capture a value once (e.g., for an initial value), suppress the warning with the `@bf-ignore` directive:

```tsx
// @bf-ignore props-destructuring
function Counter({ initial }: { initial: number }) {
  const [count, setCount] = createSignal(initial)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```


## When Destructuring Is Fine

Destructuring is safe when you use the value as an **initial value** for local state:

```tsx
function Counter({ initial }: { initial: number }) {
  const [count, setCount] = createSignal(initial) // OK — initial value only
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```

It is also safe for values that never change, such as an `id` or a static label.


## Summary

| Pattern | Reactive? | Use when |
|---------|-----------|----------|
| `props.value` | Yes | You need live updates from parent |
| `const { value } = props` | No | Value is used once (e.g., initial state) |
| `createSignal(props.value)` | `props.value` is reactive, signal is independent | Creating local state from a prop |


## How It Works

When a parent passes a dynamic expression, the compiler transforms it into a getter on the props object:

```tsx
// Parent
<Child value={count()} />

// Compiled props object
{ get value() { return count() } }
```

- `props.value` → calls the getter → calls `count()` → dependency is tracked
- `const { value } = props` → calls the getter once → stores the number → no further tracking

This is the same model as SolidJS. If you are coming from React, where destructuring props is idiomatic and safe, this is the most important behavioral difference to be aware of.
