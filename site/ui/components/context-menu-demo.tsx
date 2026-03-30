"use client"
/**
 * ContextMenuDemo Components
 *
 * Interactive demos for ContextMenu component.
 * Used in context-menu documentation page.
 *
 * Note: Due to BarefootJS compiler limitations, we explicitly write out each
 * item instead of using .map() over a local array. Local variables
 * are not preserved during compilation.
 */

import { createSignal } from '@barefootjs/dom'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuGroup,
  ContextMenuShortcut,
} from '@ui/components/ui/context-menu'

/**
 * Basic demo - right-click area with browser-like actions
 */
export function ContextMenuBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <ContextMenu open={open()} onOpenChange={setOpen}>
      <ContextMenuTrigger>
        <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <span>Back</span>
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <span>Forward</span>
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <span>Reload</span>
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <span>Save As...</span>
          <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <span>Print...</span>
          <ContextMenuShortcut>⌘P</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/**
 * Checkbox demo - right-click area with toggle options
 */
export function ContextMenuCheckboxDemo() {
  const [open, setOpen] = createSignal(false)
  const [showBookmarks, setShowBookmarks] = createSignal(true)
  const [showFullUrls, setShowFullUrls] = createSignal(false)

  return (
    <ContextMenu open={open()} onOpenChange={setOpen}>
      <ContextMenuTrigger>
        <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Appearance</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked={showBookmarks()} onCheckedChange={setShowBookmarks}>
          <span>Show Bookmarks Bar</span>
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={showFullUrls()} onCheckedChange={setShowFullUrls}>
          <span>Show Full URLs</span>
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/**
 * Full-featured demo - labels, separators, shortcuts, submenu, checkbox, radio, destructive
 */
export function ContextMenuFullDemo() {
  const [open, setOpen] = createSignal(false)
  const [showBookmarks, setShowBookmarks] = createSignal(true)
  const [showToolbar, setShowToolbar] = createSignal(false)
  const [person, setPerson] = createSignal('pedro')

  return (
    <ContextMenu open={open()} onOpenChange={setOpen}>
      <ContextMenuTrigger>
        <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <span>Back</span>
          <ContextMenuShortcut>⌘[</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <span>Forward</span>
          <ContextMenuShortcut>⌘]</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <span>Reload</span>
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <span>More Tools</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>
              <span>Save Page As...</span>
              <ContextMenuShortcut>⇧⌘S</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <span>Create Shortcut...</span>
            </ContextMenuItem>
            <ContextMenuItem>
              <span>Name Window...</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <span>Developer Tools</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuCheckboxItem checked={showBookmarks()} onCheckedChange={setShowBookmarks}>
            <span>Show Bookmarks Bar</span>
            <ContextMenuShortcut>⇧⌘B</ContextMenuShortcut>
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem checked={showToolbar()} onCheckedChange={setShowToolbar}>
            <span>Show Toolbar</span>
          </ContextMenuCheckboxItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuRadioGroup value={person()} onValueChange={setPerson}>
          <ContextMenuLabel>People</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuRadioItem value="pedro">
            <span>Pedro Duarte</span>
          </ContextMenuRadioItem>
          <ContextMenuRadioItem value="colm">
            <span>Colm Tuite</span>
          </ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
