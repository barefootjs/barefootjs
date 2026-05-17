/**
 * CommandPalette groups for site/ui.
 * Grouping is done here (not in the palette component) because barefoot's
 * analyzer doesn't follow locals derived from props.
 */

import type { CommandGroup } from '../../shared/components/command-palette'

export const commandGroups: CommandGroup[] = [
  {
    category: 'Get Started',
    items: [
      { id: 'intro', title: 'Introduction', href: '/', category: 'Get Started' },
    ],
  },
  {
    category: 'Components',
    items: [
      { id: 'accordion', title: 'Accordion', href: '/components/accordion', category: 'Components' },
      { id: 'badge', title: 'Badge', href: '/components/badge', category: 'Components' },
      { id: 'button', title: 'Button', href: '/components/button', category: 'Components' },
      { id: 'card', title: 'Card', href: '/components/card', category: 'Components' },
      { id: 'checkbox', title: 'Checkbox', href: '/components/checkbox', category: 'Components' },
      { id: 'command', title: 'Command', href: '/components/command', category: 'Components' },
      { id: 'dialog', title: 'Dialog', href: '/components/dialog', category: 'Components' },
      { id: 'dropdown-menu', title: 'Dropdown Menu', href: '/components/dropdown-menu', category: 'Components' },
      { id: 'input', title: 'Input', href: '/components/input', category: 'Components' },
      { id: 'select', title: 'Select', href: '/components/select', category: 'Components' },
      { id: 'switch', title: 'Switch', href: '/components/switch', category: 'Components' },
      { id: 'table', title: 'Table', href: '/components/table', category: 'Components' },
      { id: 'tabs', title: 'Tabs', href: '/components/tabs', category: 'Components' },
      { id: 'toast', title: 'Toast', href: '/components/toast', category: 'Components' },
      { id: 'tooltip', title: 'Tooltip', href: '/components/tooltip', category: 'Components' },
    ],
  },
  {
    category: 'Forms',
    items: [
      { id: 'forms-introduction', title: 'Introduction', href: '/docs/forms/introduction', category: 'Forms' },
      { id: 'validation', title: 'Validation', href: '/docs/forms/validation', category: 'Forms' },
      { id: 'field-arrays', title: 'Field Arrays', href: '/docs/forms/field-arrays', category: 'Forms' },
    ],
  },
]
