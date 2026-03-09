---
title: untrack
description: Executes a function without tracking signal dependencies in the current reactive context.
---

# untrack

Executes a function without tracking signal dependencies. Signal reads inside the function do not register the current effect as a subscriber.

```tsx
import { untrack } from '@barefootjs/dom'

untrack<T>(fn: () => T): T
```

Returns the value produced by `fn`.


## Basic Usage

```tsx
const [count, setCount] = createSignal(0)
const [name, setName] = createSignal('Alice')

createEffect(() => {
  // count() IS tracked — this effect re-runs when count changes
  console.log('count:', count())

  // name() is NOT tracked — changing name alone won't trigger this effect
  console.log('name:', untrack(() => name()))
})

setCount(1) // Effect re-runs
setName('Bob') // Effect does NOT re-run
```


## When to Use

### Reading a value without subscribing

```tsx
createEffect(() => {
  // Re-run only when items change, not when sortOrder changes
  const sorted = [...items()].sort(untrack(() => sortOrder()) === 'asc' ? compare : reverseCompare)
  setDisplayList(sorted)
})
```

### Logging without creating dependencies

```tsx
createEffect(() => {
  const value = computedResult()
  console.log('Updated at:', untrack(() => new Date().toISOString()))
})
```

### Breaking circular patterns

If two signals depend on each other through effects, `untrack` can break the cycle by reading one without subscribing:

```tsx
createEffect(() => {
  const a = signalA()
  const b = untrack(() => signalB()) // Read B without tracking
  setResult(a + b)
})
```
