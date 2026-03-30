"use client"
/**
 * PopoverDemo Components
 *
 * Interactive demos for Popover component.
 * Used in popover documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from '@ui/components/ui/popover'

/**
 * Preview demo - Dimensions settings popover (similar to shadcn/ui example)
 */
export function PopoverPreviewDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger>
        <span
          className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Open popover
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Width</span>
              <input
                className="col-span-2 h-8 rounded-md border bg-background px-3 text-sm"
                value="100%"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Max. width</span>
              <input
                className="col-span-2 h-8 rounded-md border bg-background px-3 text-sm"
                value="300px"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Height</span>
              <input
                className="col-span-2 h-8 rounded-md border bg-background px-3 text-sm"
                value="25px"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="text-sm">Max. height</span>
              <input
                className="col-span-2 h-8 rounded-md border bg-background px-3 text-sm"
                value="none"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Basic demo - simple text content popover
 */
export function PopoverBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger>
        <span
          className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Click me
        </span>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">About</h4>
          <p className="text-sm text-muted-foreground">
            This is a basic popover with simple text content. It opens on click and closes when you click outside or press ESC.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Form demo - popover with notification preferences form
 */
export function PopoverFormDemo() {
  const [open, setOpen] = createSignal(false)
  const [saved, setSaved] = createSignal(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      setOpen(false)
    }, 1500)
  }

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger>
        <span
          className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          <span>Settings</span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Configure how you receive notifications.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm" for="popover-email">Email</label>
              <input
                id="popover-email"
                type="email"
                placeholder="you@example.com"
                className="h-8 w-48 rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm" for="popover-frequency">Frequency</label>
              <select
                id="popover-frequency"
                className="h-8 w-48 rounded-md border bg-background px-3 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between">
            <PopoverClose className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent">
              <span>Cancel</span>
            </PopoverClose>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
            >
              {saved() ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
