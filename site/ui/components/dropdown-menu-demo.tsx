"use client"
/**
 * DropdownMenuDemo Components
 *
 * Interactive demos for DropdownMenu component.
 * Used in dropdown-menu documentation page.
 *
 * Note: Due to BarefootJS compiler limitations, we explicitly write out each
 * item instead of using .map() over a local array. Local variables
 * are not preserved during compilation.
 */

import { createSignal } from '@barefootjs/dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '@ui/components/ui/dropdown-menu'
import { SettingsIcon, GlobeIcon, LogOutIcon, CircleHelpIcon } from '@ui/components/ui/icon'

/**
 * Basic demo - simple menu with a few items
 */
export function DropdownMenuBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <DropdownMenu open={open()} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <span
          className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          Open Menu
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span>Copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span>Paste</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Checkbox demo - toggle options without closing the menu
 */
export function DropdownMenuCheckboxDemo() {
  const [open, setOpen] = createSignal(false)
  const [showStatus, setShowStatus] = createSignal(true)
  const [showActivity, setShowActivity] = createSignal(false)

  return (
    <DropdownMenu open={open()} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <span
          className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          View
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Toggle Panels</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showStatus()} onCheckedChange={setShowStatus}>
          <span>Status Bar</span>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showActivity()} onCheckedChange={setShowActivity}>
          <span>Activity Panel</span>
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Profile menu demo - avatar trigger with account actions
 * Features: submenu, checkbox items, radio items, destructive variant
 */
export function DropdownMenuProfileDemo() {
  const [open, setOpen] = createSignal(false)
  const [showBookmarks, setShowBookmarks] = createSignal(true)
  const [showToolbar, setShowToolbar] = createSignal(false)
  const [language, setLanguage] = createSignal('en')

  return (
    <DropdownMenu open={open()} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="rounded-full p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
          aria-label="Profile menu"
        >
          KK
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <SettingsIcon size="sm" />
            <span>Settings</span>
            <DropdownMenuShortcut>⇧⌘,</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <GlobeIcon size="sm" />
              <span>Language</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={language()} onValueChange={setLanguage}>
                <DropdownMenuRadioItem value="en">
                  <span>English</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ja">
                  <span>Japanese</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fr">
                  <span>French</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <CircleHelpIcon size="sm" />
            <span>Help</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem checked={showBookmarks()} onCheckedChange={setShowBookmarks}>
            <span>Show Bookmarks Bar</span>
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={showToolbar()} onCheckedChange={setShowToolbar}>
            <span>Show Toolbar</span>
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOutIcon size="sm" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
