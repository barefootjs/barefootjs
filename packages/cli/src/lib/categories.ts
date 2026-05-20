// Hardcoded category, tag, and related component mapping for all 33 components.
// Categories are a human judgment; regex-based guessing would be fragile.

import type { ComponentCategory } from './types'

export const categoryMap: Record<string, ComponentCategory> = {
  // input
  'button': 'input',
  'checkbox': 'input',
  'input': 'input',
  'label': 'input',
  'radio-group': 'input',
  'select': 'input',
  'slider': 'input',
  'switch': 'input',
  'textarea': 'input',
  'toggle': 'input',
  'toggle-group': 'input',
  // overlay
  'alert-dialog': 'overlay',
  'dialog': 'overlay',
  'drawer': 'overlay',
  'dropdown-menu': 'overlay',
  'hover-card': 'overlay',
  'popover': 'overlay',
  'sheet': 'overlay',
  'tooltip': 'overlay',
  'toast': 'overlay',
  // navigation
  'accordion': 'navigation',
  'breadcrumb': 'navigation',
  'collapsible': 'navigation',
  'pagination': 'navigation',
  'tabs': 'navigation',
  // layout
  'card': 'layout',
  'resizable': 'layout',
  'scroll-area': 'layout',
  'separator': 'layout',
  // display
  'badge': 'display',
  'icon': 'display',
  'portal': 'display',
  'slot': 'display',
}

export const relatedMap: Record<string, string[]> = {
  'button': ['toggle', 'slot'],
  'checkbox': ['switch', 'radio-group', 'toggle'],
  'input': ['textarea', 'label', 'select'],
  'label': ['input', 'checkbox', 'switch'],
  'radio-group': ['checkbox', 'toggle-group', 'select'],
  'select': ['dropdown-menu', 'radio-group', 'input'],
  'slider': ['input', 'switch'],
  'switch': ['checkbox', 'toggle'],
  'textarea': ['input', 'label'],
  'toggle': ['button', 'switch', 'toggle-group'],
  'toggle-group': ['toggle', 'radio-group', 'tabs'],
  'alert-dialog': ['dialog', 'drawer', 'sheet'],
  'dialog': ['alert-dialog', 'drawer', 'sheet'],
  'drawer': ['dialog', 'sheet', 'alert-dialog'],
  'dropdown-menu': ['popover', 'select'],
  'hover-card': ['tooltip', 'popover'],
  'popover': ['dropdown-menu', 'hover-card', 'tooltip'],
  'sheet': ['dialog', 'drawer', 'alert-dialog'],
  'tooltip': ['hover-card', 'popover'],
  'toast': ['alert-dialog', 'dialog'],
  'accordion': ['collapsible', 'tabs'],
  'breadcrumb': ['pagination', 'tabs'],
  'collapsible': ['accordion'],
  'pagination': ['breadcrumb'],
  'tabs': ['accordion', 'toggle-group'],
  'card': ['separator'],
  'resizable': ['scroll-area'],
  'scroll-area': ['resizable'],
  'separator': ['card'],
  'badge': ['button'],
  'icon': ['button'],
  'portal': ['dialog', 'drawer', 'sheet', 'popover'],
  'slot': ['button'],
}

/**
 * Auto-detect tags from source code patterns.
 */
export function detectTags(source: string): string[] {
  const tags: string[] = []

  // stateful: imports any reactive primitive from `@barefootjs/client`.
  // The runtime package was renamed from `@barefootjs/dom` → `@barefootjs/client`,
  // but this regex was not updated alongside it, so the tag silently
  // disappeared from every `ui/meta/*.json` regen after the move.
  if (/import\s+\{[^}]*(?:createSignal|createEffect|createMemo)[^}]*\}\s+from\s+['"]@barefootjs\/client['"]/.test(source)) {
    tags.push('stateful')
  }

  // multi-component: has multiple export names
  const exportMatch = source.match(/export\s+\{([^}]+)\}/)
  if (exportMatch) {
    const exports = exportMatch[1].split(',').filter(e => !e.trim().startsWith('type ') && e.trim().length > 0)
    if (exports.length > 1) {
      tags.push('multi-component')
    }
  }

  // portal: uses createPortal
  if (/createPortal/.test(source)) {
    tags.push('portal')
  }

  // context: uses createContext
  if (/createContext/.test(source)) {
    tags.push('context')
  }

  // controlled: has both checked/open and onChange callback pattern
  if (/(?:defaultChecked|defaultValue|defaultOpen)/.test(source)) {
    tags.push('controlled')
  }

  // aria: uses role= or aria- attributes
  if (/(?:role=|aria-)/.test(source)) {
    tags.push('aria')
  }

  return tags
}
