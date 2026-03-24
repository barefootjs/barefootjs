import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { renderToTest } from '@barefootjs/test'

const contextMenuSource = readFileSync(resolve(__dirname, 'index.tsx'), 'utf-8')

// ---------------------------------------------------------------------------
// ContextMenu (stateful root — manages posX/posY signals, Provider wrapping)
// ---------------------------------------------------------------------------

describe('ContextMenu', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenu')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenu', () => {
    expect(result.componentName).toBe('ContextMenu')
  })

  test('has signals: position', () => {
    expect(result.signals).toContain('position')
  })

  test('renders as div with data-slot=context-menu', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('context-menu')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuTrigger (right-click handler, display:contents)
// ---------------------------------------------------------------------------

describe('ContextMenuTrigger', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuTrigger')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuTrigger', () => {
    expect(result.componentName).toBe('ContextMenuTrigger')
  })

  test('renders as span with display:contents', () => {
    const span = result.find({ tag: 'span' })
    expect(span).not.toBeNull()
    expect(span!.props['style']).toBe('display:contents')
  })

  test('has data-slot=context-menu-trigger', () => {
    const span = result.find({ tag: 'span' })!
    expect(span.props['data-slot']).toBe('context-menu-trigger')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuContent (portaled menu container, role=menu)
// ---------------------------------------------------------------------------

describe('ContextMenuContent', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuContent')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuContent', () => {
    expect(result.componentName).toBe('ContextMenuContent')
  })

  test('renders as div with role=menu', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('menu')
  })

  test('has data-slot=context-menu-content', () => {
    expect(result.root.props['data-slot']).toBe('context-menu-content')
  })

  test('has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('fixed')
    expect(result.root.classes).toContain('z-50')
    expect(result.root.classes).toContain('rounded-md')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuItem (action item, role=menuitem, click event)
// ---------------------------------------------------------------------------

describe('ContextMenuItem', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuItem')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuItem', () => {
    expect(result.componentName).toBe('ContextMenuItem')
  })

  test('renders as div with role=menuitem', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('menuitem')
  })

  test('has data-slot=context-menu-item', () => {
    expect(result.root.props['data-slot']).toBe('context-menu-item')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('flex')
    expect(result.root.classes).toContain('cursor-pointer')
    expect(result.root.classes).toContain('select-none')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuCheckboxItem (checkbox behavior, role=menuitemcheckbox)
// ---------------------------------------------------------------------------

describe('ContextMenuCheckboxItem', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuCheckboxItem')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuCheckboxItem', () => {
    expect(result.componentName).toBe('ContextMenuCheckboxItem')
  })

  test('renders as div with role=menuitemcheckbox', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('menuitemcheckbox')
  })

  test('has aria-checked attribute', () => {
    expect(result.root.aria).toHaveProperty('checked')
  })

  test('contains conditional CheckIcon child (checkmark)', () => {
    const icon = result.find({ componentName: 'CheckIcon' })
    expect(icon).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// ContextMenuRadioGroup (group container, role=group)
// ---------------------------------------------------------------------------

describe('ContextMenuRadioGroup', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuRadioGroup')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuRadioGroup', () => {
    expect(result.componentName).toBe('ContextMenuRadioGroup')
  })

  test('renders as div with role=group', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.role).toBe('group')
  })

  test('has data-slot=context-menu-radio-group', () => {
    const div = result.find({ tag: 'div' })!
    expect(div.props['data-slot']).toBe('context-menu-radio-group')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuRadioItem (radio behavior, role=menuitemradio)
// ---------------------------------------------------------------------------

describe('ContextMenuRadioItem', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuRadioItem')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuRadioItem', () => {
    expect(result.componentName).toBe('ContextMenuRadioItem')
  })

  test('renders as div with role=menuitemradio', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('menuitemradio')
  })

  test('has aria-checked attribute', () => {
    expect(result.root.aria).toHaveProperty('checked')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuSub (submenu container, manages sub-open state)
// ---------------------------------------------------------------------------

describe('ContextMenuSub', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuSub')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuSub', () => {
    expect(result.componentName).toBe('ContextMenuSub')
  })

  test('has signals: subOpen', () => {
    expect(result.signals).toContain('subOpen')
  })

  test('renders as div with data-slot=context-menu-sub', () => {
    const div = result.find({ tag: 'div' })
    expect(div).not.toBeNull()
    expect(div!.props['data-slot']).toBe('context-menu-sub')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuSubTrigger (hover/click to open submenu, aria-haspopup)
// ---------------------------------------------------------------------------

describe('ContextMenuSubTrigger', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuSubTrigger')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuSubTrigger', () => {
    expect(result.componentName).toBe('ContextMenuSubTrigger')
  })

  test('renders as div with role=menuitem', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('menuitem')
  })

  test('has aria-haspopup=menu', () => {
    expect(result.root.aria).toHaveProperty('haspopup')
  })

  test('has aria-expanded attribute', () => {
    expect(result.root.aria).toHaveProperty('expanded')
  })

  test('has data-sub-trigger=true', () => {
    expect(result.root.props['data-sub-trigger']).toBe('true')
  })

  test('contains chevron icon', () => {
    const icon = result.find({ componentName: 'ChevronRightIcon' })
    expect(icon).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// ContextMenuSubContent (submenu content, role=menu)
// ---------------------------------------------------------------------------

describe('ContextMenuSubContent', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuSubContent')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuSubContent', () => {
    expect(result.componentName).toBe('ContextMenuSubContent')
  })

  test('renders as div with role=menu', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('menu')
  })

  test('has data-slot=context-menu-sub-content', () => {
    expect(result.root.props['data-slot']).toBe('context-menu-sub-content')
  })

  test('has data-state=closed (initial state)', () => {
    expect(result.root.dataState).toBe('closed')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuLabel (section heading, no role)
// ---------------------------------------------------------------------------

describe('ContextMenuLabel', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuLabel')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuLabel', () => {
    expect(result.componentName).toBe('ContextMenuLabel')
  })

  test('renders as div with data-slot=context-menu-label', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.props['data-slot']).toBe('context-menu-label')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('font-semibold')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuSeparator (visual divider, role=separator)
// ---------------------------------------------------------------------------

describe('ContextMenuSeparator', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuSeparator')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuSeparator', () => {
    expect(result.componentName).toBe('ContextMenuSeparator')
  })

  test('renders as div with role=separator', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('separator')
  })

  test('has data-slot=context-menu-separator', () => {
    expect(result.root.props['data-slot']).toBe('context-menu-separator')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuShortcut (keyboard shortcut display)
// ---------------------------------------------------------------------------

describe('ContextMenuShortcut', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuShortcut')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuShortcut', () => {
    expect(result.componentName).toBe('ContextMenuShortcut')
  })

  test('renders as span with data-slot=context-menu-shortcut', () => {
    expect(result.root.tag).toBe('span')
    expect(result.root.props['data-slot']).toBe('context-menu-shortcut')
  })

  test('has resolved CSS classes', () => {
    expect(result.root.classes).toContain('ml-auto')
    expect(result.root.classes).toContain('tracking-widest')
  })
})

// ---------------------------------------------------------------------------
// ContextMenuGroup (semantic grouping, role=group)
// ---------------------------------------------------------------------------

describe('ContextMenuGroup', () => {
  const result = renderToTest(contextMenuSource, 'context-menu.tsx', 'ContextMenuGroup')

  test('has no compiler errors', () => {
    expect(result.errors).toEqual([])
  })

  test('componentName is ContextMenuGroup', () => {
    expect(result.componentName).toBe('ContextMenuGroup')
  })

  test('renders as div with role=group', () => {
    expect(result.root.tag).toBe('div')
    expect(result.root.role).toBe('group')
  })

  test('has data-slot=context-menu-group', () => {
    expect(result.root.props['data-slot']).toBe('context-menu-group')
  })
})
