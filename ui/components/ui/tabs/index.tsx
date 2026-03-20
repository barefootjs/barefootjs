"use client"

/**
 * Tabs Components
 *
 * A set of layered sections of content displayed one at a time.
 * Inspired by shadcn/ui with CSS variable theming support.
 *
 * Design Decision: Props-based state management instead of Context.
 * The parent component should use signals to track state and pass
 * `selected` prop to TabsTrigger and TabsContent for matching.
 *
 * @example Basic tabs
 * ```tsx
 * const [activeTab, setActiveTab] = useState('account')
 *
 * <Tabs value={activeTab} onValueChange={setActiveTab}>
 *   <TabsList>
 *     <TabsTrigger value="account" selected={activeTab === 'account'} onClick={() => setActiveTab('account')}>
 *       Account
 *     </TabsTrigger>
 *     <TabsTrigger value="password" selected={activeTab === 'password'} onClick={() => setActiveTab('password')}>
 *       Password
 *     </TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="account" selected={activeTab === 'account'}>
 *     Account settings here
 *   </TabsContent>
 *   <TabsContent value="password" selected={activeTab === 'password'}>
 *     Password settings here
 *   </TabsContent>
 * </Tabs>
 * ```
 */

import type { HTMLBaseAttributes, ButtonHTMLAttributes } from '@barefootjs/jsx'

import type { Child } from '../../../types'

// Tabs container classes
const tabsClasses = 'flex flex-col gap-2 w-full'

// TabsList classes
const tabsListClasses = 'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]'

// TabsTrigger base classes
const tabsTriggerBaseClasses = 'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4'

// TabsTrigger focus classes
const tabsTriggerFocusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

// TabsTrigger state classes (driven by data-state attribute, no runtime class switching)
const tabsTriggerStateClasses = 'text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30'

// TabsContent classes
const tabsContentClasses = 'flex-1 outline-none'

/**
 * Props for Tabs component.
 */
interface TabsProps extends HTMLBaseAttributes {
  /** Currently selected tab value */
  value?: string
  /** Default selected value (uncontrolled) */
  defaultValue?: string
  /** Callback when tab changes */
  onValueChange?: (value: string) => void
  /** Tab components (TabsList and TabsContent) */
  children?: Child
}

/**
 * Tabs container component.
 *
 * @param props.value - Currently selected tab value
 * @param props.defaultValue - Default value for uncontrolled usage
 * @param props.onValueChange - Callback when tab changes
 */
function Tabs({
  className = '',
  value,
  defaultValue,
  children,
  ...props
}: TabsProps) {
  return (
    <div data-slot="tabs" data-value={value || defaultValue} className={`${tabsClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Props for TabsList component.
 */
interface TabsListProps extends HTMLBaseAttributes {
  /** TabsTrigger components */
  children?: Child
}

/**
 * Container for tab triggers.
 *
 * @param props.children - TabsTrigger components
 */
function TabsList({
  className = '',
  children,
  ...props
}: TabsListProps) {
  return (
    <div data-slot="tabs-list" role="tablist" className={`${tabsListClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

/**
 * Props for TabsTrigger component.
 */
interface TabsTriggerProps extends ButtonHTMLAttributes {
  /** Value that identifies this tab */
  value: string
  /** Whether this tab is currently selected */
  selected?: boolean
  /** Whether this tab is disabled */
  disabled?: boolean
  /** Click handler */
  onClick?: () => void
  /** Tab label */
  children?: Child
}

/**
 * Individual tab button.
 *
 * @param props.value - Tab identifier
 * @param props.selected - Whether selected
 * @param props.disabled - Whether disabled
 * @param props.onClick - Click handler
 */
function TabsTrigger(props: TabsTriggerProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.currentTarget as HTMLElement
    const tabList = target.closest('[role="tablist"]')
    if (!tabList) return

    const tabs = tabList.querySelectorAll('[role="tab"]:not([disabled])')
    const currentIndex = Array.from(tabs).indexOf(target)

    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = tabs.length - 1
        break
    }

    if (nextIndex !== null && tabs[nextIndex]) {
      const nextTab = tabs[nextIndex] as HTMLElement
      nextTab.focus()
      nextTab.click()
    }
  }

  const classes = `${tabsTriggerBaseClasses} ${tabsTriggerFocusClasses} ${tabsTriggerStateClasses} ${props.className ?? ''}`

  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      aria-selected={props.selected ?? false}
      disabled={props.disabled ?? false}
      data-state={(props.selected ?? false) ? 'active' : 'inactive'}
      data-value={props.value}
      tabindex={(props.selected ?? false) ? 0 : -1}
      id={props.id}
      className={classes}
      onClick={props.onClick}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </button>
  )
}

/**
 * Props for TabsContent component.
 */
interface TabsContentProps extends HTMLBaseAttributes {
  /** Value that identifies which tab this content belongs to */
  value: string
  /** Whether this content is currently visible */
  selected?: boolean
  /** Content to display */
  children?: Child
}

/**
 * Content panel for a tab.
 *
 * @param props.value - Tab identifier
 * @param props.selected - Whether visible
 */
function TabsContent(props: TabsContentProps) {
  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      tabindex={0}
      data-state={(props.selected ?? false) ? 'active' : 'inactive'}
      data-value={props.value}
      id={props.id}
      className={`${tabsContentClasses} ${(props.selected ?? false) ? '' : 'hidden'} ${props.className ?? ''}`}
    >
      {props.children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps }
