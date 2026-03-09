---
title: Portals
description: Render elements outside their parent DOM hierarchy for overlays, modals, and tooltips.
---

# Portals

A portal renders an element outside its parent DOM hierarchy. This is useful for overlays, modals, and tooltips that need to escape `overflow: hidden`, `z-index` stacking contexts, or other CSS containment.

```tsx
import { createPortal } from '@barefootjs/dom'
```


## `createPortal`

Moves an element to a different container in the DOM.

```tsx
createPortal(children, container?, options?)
```

**Type:**

```tsx
type Portal = {
  element: HTMLElement
  unmount: () => void
}

interface PortalOptions {
  ownerScope?: Element  // Component scope for scoped queries
}

function createPortal(
  children: HTMLElement | string,
  container?: HTMLElement,           // Default: document.body
  options?: PortalOptions
): Portal
```

**Returns** a `Portal` object with:
- `element` — the mounted DOM element
- `unmount()` — removes the element from the container


## Basic Usage

Portals are typically created inside a `ref` callback. The element is moved to `document.body` (or another container) after it is mounted:

```tsx
"use client"
import { createSignal, createEffect, createPortal, isSSRPortal } from '@barefootjs/dom'

export function Tooltip(props: { text: string; children?: Child }) {
  const [visible, setVisible] = createSignal(false)

  const handleMount = (el: HTMLElement) => {
    // Move to document.body to avoid overflow/z-index issues
    if (el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[bf-s]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }

    createEffect(() => {
      el.hidden = !visible()
    })
  }

  return (
    <div>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {props.children}
      </span>
      <div className="tooltip" ref={handleMount}>
        {props.text}
      </div>
    </div>
  )
}
```


## SSR Portal Detection

When a portal is server-rendered, it is already in the correct position in the DOM. `isSSRPortal` checks whether an element was already portaled during SSR to prevent double-portaling:

```tsx
import { isSSRPortal } from '@barefootjs/dom'

const handleMount = (el: HTMLElement) => {
  // Skip if already portaled during SSR
  if (el.parentNode !== document.body && !isSSRPortal(el)) {
    createPortal(el, document.body)
  }
}
```

SSR portals are marked with `bf-pi` attributes. After hydration, call `cleanupPortalPlaceholder` to remove the SSR placeholder:

```tsx
import { cleanupPortalPlaceholder } from '@barefootjs/dom'

cleanupPortalPlaceholder(portalId)
```


## Owner Scope

By default, an element moved to `document.body` via a portal is outside its original component's scope. This means the runtime's `find()` function cannot locate it when searching within the component boundary.

The `ownerScope` option solves this by linking the portaled element back to its parent component:

```tsx
const handleMount = (el: HTMLElement) => {
  const ownerScope = el.closest('[bf-s]') ?? undefined
  createPortal(el, document.body, { ownerScope })
}
```

The portal sets `bf-po` on the moved element, so scoped queries from the owner component still find it.


## Dialog Example

A common use of portals is moving dialog overlays and content to `document.body`:

```tsx
"use client"
import { createPortal, isSSRPortal, useContext, createEffect } from '@barefootjs/dom'

function DialogOverlay() {
  const handleMount = (el: HTMLElement) => {
    // Portal to body
    if (el.parentNode !== document.body && !isSSRPortal(el)) {
      const ownerScope = el.closest('[bf-s]') ?? undefined
      createPortal(el, document.body, { ownerScope })
    }

    const ctx = useContext(DialogContext)

    // Reactive visibility
    createEffect(() => {
      const isOpen = ctx.open()
      el.dataset.state = isOpen ? 'open' : 'closed'
      el.className = isOpen ? 'overlay overlay-visible' : 'overlay overlay-hidden'
    })

    // Click overlay to close
    el.addEventListener('click', () => {
      ctx.onOpenChange(false)
    })
  }

  return <div data-slot="dialog-overlay" ref={handleMount} />
}
```

The overlay is rendered inside the `<Dialog>` component tree (so it can access `DialogContext`), but is moved to `document.body` by the portal (so it escapes any CSS containment).


## Cleanup

Use `portal.unmount()` to remove a portaled element. Combine with `onCleanup` to clean up when a component is destroyed:

```tsx
import { createPortal, onCleanup } from '@barefootjs/dom'

const handleMount = (el: HTMLElement) => {
  const portal = createPortal(el, document.body)

  onCleanup(() => {
    portal.unmount()
  })
}
```


## Custom Container

By default, `createPortal` appends to `document.body`. You can specify a different container:

```tsx
const container = document.getElementById('modal-root')!
createPortal(el, container)
```

This is useful when you have a dedicated mount point in your HTML layout for modals or notifications.
