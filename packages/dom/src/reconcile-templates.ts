/**
 * BarefootJS - Template-based List Reconciliation
 *
 * Key-based DOM reconciliation for template-string-based list rendering.
 * Used when renderItem returns HTML string.
 */

/**
 * Reconcile a list container using template string mode.
 * Re-renders HTML for each item, preserves focus state.
 *
 * On first run after SSR, detects server-rendered children (no data-key)
 * and preserves them by tagging with data-key instead of replacing.
 *
 * @param container - The parent element containing list items
 * @param items - Array of items to render
 * @param getKey - Function to extract a unique key from each item (or null to use index)
 * @param renderItem - Function that returns an HTML string for each item
 */
export function reconcileTemplates<T>(
  container: HTMLElement | null,
  items: T[],
  getKey: ((item: T, index: number) => string) | null,
  renderItem: (item: T, index: number) => string
): void {
  if (!container || !items) return

  if (items.length === 0) {
    container.innerHTML = ''
    return
  }

  // HYDRATION: If container has children but none have data-key,
  // this is the first run after SSR. Tag existing elements and return
  // to preserve server-rendered content (which includes real component elements).
  const firstChild = container.firstElementChild as HTMLElement | null
  if (firstChild && firstChild.dataset.key === undefined) {
    for (let i = 0; i < items.length && i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement
      const key = getKey ? getKey(items[i], i) : String(i)
      child.setAttribute('data-key', key)
    }
    // Remove extra children (if SSR rendered more than current items)
    while (container.children.length > items.length) {
      container.lastElementChild?.remove()
    }
    // Call renderItem and update innerHTML for each element.
    // This serves two purposes:
    // 1. Signal dependency tracking: signals inside the template function are
    //    accessed during renderItem, registering them with the enclosing createEffect
    // 2. Inner loop key attributes: SSR doesn't render data-key-N attributes,
    //    but the template includes them for nested loop event delegation
    for (let i = 0; i < items.length && i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement
      const html = renderItem(items[i], i)
      const tpl = document.createElement('template')
      tpl.innerHTML = html.trim()
      const newEl = tpl.content.firstChild as HTMLElement
      if (newEl && child) {
        child.innerHTML = newEl.innerHTML
      }
    }
    return
  }

  // Save focus state before DOM manipulation
  const activeElement = document.activeElement as HTMLElement | null
  const focusedKey = activeElement?.closest('[data-key]')?.getAttribute('data-key')
  const focusedSelector = activeElement?.tagName?.toLowerCase()
  const focusedEventId = activeElement?.getAttribute('data-event-id')

  // Build key -> element map from existing children
  const existingByKey = new Map<string, HTMLElement>()
  for (const child of Array.from(container.children)) {
    const el = child as HTMLElement
    const key = el.dataset.key
    if (key !== undefined) {
      existingByKey.set(key, el)
    }
  }

  // Process new items and build new DOM structure
  const fragment = document.createDocumentFragment()

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const key = getKey ? getKey(item, i) : String(i)

    // Always render the new content
    const html = renderItem(item, i)
    const template = document.createElement('template')
    template.innerHTML = html.trim()
    const newEl = template.content.firstChild as HTMLElement

    // Skip if renderItem returned empty HTML
    if (!newEl) continue

    let el: HTMLElement
    if (existingByKey.has(key)) {
      // Reuse existing element but update its content and attributes
      el = existingByKey.get(key)!
      existingByKey.delete(key) // Mark as used

      // Update attributes from new element
      updateAttributes(el, newEl)

      // Check if there's any focused input in the container
      const hasFocusedInput = container.contains(activeElement) &&
        (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA')

      if (hasFocusedInput) {
        updateChildrenSelectively(el, newEl)
      } else {
        el.innerHTML = newEl.innerHTML
      }
    } else {
      // Use newly created element
      el = newEl
    }
    fragment.appendChild(el)
  }

  // Clear and append - unused elements are automatically removed
  container.innerHTML = ''
  container.appendChild(fragment)

  // Restore focus if it was inside this container
  if (focusedKey && focusedSelector && container.contains(document.activeElement) === false) {
    const keyEl = container.querySelector(`[data-key="${focusedKey}"]`)
    if (keyEl) {
      let targetEl: HTMLElement | null = null
      if (focusedEventId) {
        targetEl = keyEl.querySelector(`${focusedSelector}[data-event-id="${focusedEventId}"]`)
      }
      if (!targetEl) {
        targetEl = keyEl.querySelector(focusedSelector)
      }
      if (targetEl && typeof targetEl.focus === 'function') {
        targetEl.focus()
      }
    }
  }
}

/**
 * Selectively update children, preserving input elements that may have focus.
 */
function updateChildrenSelectively(existing: HTMLElement, newEl: HTMLElement): void {
  const existingChildren = Array.from(existing.children) as HTMLElement[]
  const newChildren = Array.from(newEl.children) as HTMLElement[]

  for (let i = 0; i < newChildren.length && i < existingChildren.length; i++) {
    const existingChild = existingChildren[i]
    const newChild = newChildren[i]

    if (existingChild.tagName !== newChild.tagName) {
      existingChild.replaceWith(newChild.cloneNode(true))
      continue
    }

    if (existingChild.tagName === 'INPUT' || existingChild.tagName === 'TEXTAREA') {
      updateAttributesExcept(existingChild, newChild, ['value', 'checked'])
    } else {
      updateAttributes(existingChild, newChild)
      if (!existingChild.querySelector('input, textarea')) {
        existingChild.textContent = newChild.textContent
      } else {
        updateChildrenSelectively(existingChild, newChild)
      }
    }
  }

  if (newChildren.length > existingChildren.length) {
    for (let i = existingChildren.length; i < newChildren.length; i++) {
      existing.appendChild(newChildren[i].cloneNode(true))
    }
  }

  if (existingChildren.length > newChildren.length) {
    for (let i = existingChildren.length - 1; i >= newChildren.length; i--) {
      existingChildren[i].remove()
    }
  }
}

/**
 * Update attributes on an existing element, excluding specified attribute names.
 */
function updateAttributesExcept(existing: HTMLElement, newEl: HTMLElement, excludeAttrs: string[]): void {
  const excludeSet = new Set(excludeAttrs.map(a => a.toLowerCase()))

  const existingAttrs = Array.from(existing.attributes)
  for (const attr of existingAttrs) {
    if (!excludeSet.has(attr.name.toLowerCase()) && !newEl.hasAttribute(attr.name)) {
      existing.removeAttribute(attr.name)
    }
  }

  const newAttrs = Array.from(newEl.attributes)
  for (const attr of newAttrs) {
    if (!excludeSet.has(attr.name.toLowerCase()) && existing.getAttribute(attr.name) !== attr.value) {
      existing.setAttribute(attr.name, attr.value)
    }
  }
}

/**
 * Update attributes on an existing element to match a new element.
 */
function updateAttributes(existing: HTMLElement, newEl: HTMLElement): void {
  const existingAttrs = Array.from(existing.attributes)
  for (const attr of existingAttrs) {
    if (!newEl.hasAttribute(attr.name)) {
      existing.removeAttribute(attr.name)
    }
  }

  const newAttrs = Array.from(newEl.attributes)
  for (const attr of newAttrs) {
    if (existing.getAttribute(attr.name) !== attr.value) {
      existing.setAttribute(attr.name, attr.value)
    }
  }
}
