---
title: Reactivity
description: Fine-grained reactive primitives inspired by SolidJS, including signals, effects, memos, and lifecycle hooks.
---

# Reactivity

BarefootJS uses fine-grained reactivity inspired by SolidJS. For a conceptual overview, see [Core Concepts](./core-concepts.md#signal-based-reactivity).

All reactive primitives are imported from `@barefootjs/dom`:

```tsx
import { createSignal, createEffect, createMemo, onMount, onCleanup, untrack } from '@barefootjs/dom'
```

## API Reference

| API | Description |
|-----|-------------|
| [`createSignal`](./reactivity/create-signal.md) | Create a reactive value |
| [`createEffect`](./reactivity/create-effect.md) | Run side effects when dependencies change |
| [`createMemo`](./reactivity/create-memo.md) | Create a cached derived value |
| [`onMount`](./reactivity/on-mount.md) | Run once on component initialization |
| [`onCleanup`](./reactivity/on-cleanup.md) | Register cleanup for effects and lifecycle |
| [`untrack`](./reactivity/untrack.md) | Read signals without tracking dependencies |

## Guides

- [Props Reactivity](./reactivity/props-reactivity.md) — How props stay reactive, and when destructuring breaks it
