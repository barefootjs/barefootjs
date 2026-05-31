---
title: batch
description: Groups multiple signal writes so dependent effects and memos run once, after all writes complete.
---

# batch

Groups multiple signal writes so that dependent effects and memos run **once**,
after all the writes inside the batch complete — instead of once per write.

```tsx
import { batch } from '@barefootjs/client'

batch<T>(fn: () => T): T
```

Returns the value produced by `fn`.

## Default behavior (no batch)

BarefootJS propagates updates **synchronously**: each setter call immediately
re-runs every subscriber. This keeps reads-after-writes predictable — after a
setter returns, derived memos, effects, and the DOM already reflect the new value.

The cost is that writing N signals that share a subscriber re-runs that
subscriber N times, and the subscriber briefly observes intermediate states
where some signals are updated and others are not:

```tsx
const [x, setX] = createSignal(40)
const [y, setY] = createSignal(60)

createEffect(() => {
  // depends on both x and y
  send({ x: x(), y: y() })
})

setX(70) // effect runs — observes x=70, y=60 (intermediate)
setY(30) // effect runs again — observes x=70, y=30
```

The effect ran twice and saw a transient `x=70, y=60` state.

## With batch

```tsx
batch(() => {
  setX(70)
  setY(30)
})
// effect runs once, observing x=70, y=30
```

Inside `batch`, writes are collected and dependent subscribers are de-duplicated,
so each runs **exactly once** after the batch ends — and never observes an
intermediate, half-updated state.

## When to use

### Multiple signal writes in one event handler

When a single handler updates several signals that feed shared effects/memos,
`batch` collapses the work into one update pass:

```tsx
const reset = () => {
  batch(() => {
    setName('')
    setEmail('')
    setAge(0)
    // ...20 more fields
  })
  // every subscriber ran once, not once-per-field
}
```

### Glitch-free consistency for cross-field invariants

If an effect relies on an invariant that spans multiple signals (e.g. `x + y`
must always equal `100`), `batch` ensures the effect never runs while the
invariant is temporarily broken.

## Caveats

### Derived values are stale *inside* the batch

`batch` defers the work that recomputes derived values. Plain signal reads return
the new value immediately, but **memos and effect-driven values stay stale until
the batch ends**:

```tsx
const [n, setN] = createSignal(1)
const doubled = createMemo(() => n() * 2)

batch(() => {
  setN(10)
  n()       // 10  — plain signal read is fresh
  doubled() // 2   — STALE; the memo hasn't recomputed yet
})
doubled()   // 20  — recomputed after the batch ends
```

If you need the recomputed value, read it after the batch.

### Nested batches flush at the outermost end

Batches can be nested; effects flush only when the outermost batch completes.

```tsx
batch(() => {
  setA(1)
  batch(() => { setB(2) })
  // inner batch ended, but nothing has flushed yet
})
// effects flush here
```

### `await` escapes the batch

`batch` only covers the **synchronous** portion of `fn`. Writes after an `await`
run outside the batch and are no longer grouped:

```tsx
const onSubmit = async () => {
  batch(async () => {
    setLoading(true)        // batched
    await save()
    setLoading(false)       // NOT batched — runs after the batch flushed
    setResult('ok')         // NOT batched
  })
}
```

For async handlers, wrap each synchronous group of writes in its own `batch`.

## Note

`batch` is an **opt-in** optimization. Forgetting it is never a correctness bug —
code still works, just with extra subscriber runs. Reach for `batch` when a
handler writes many signals that share subscribers, or when an effect must not
observe a partially-updated state.
