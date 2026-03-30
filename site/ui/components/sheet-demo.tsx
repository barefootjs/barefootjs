"use client"
/**
 * SheetDemo Components
 *
 * Interactive demos for Sheet component.
 * Used in sheet documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  Sheet,
  SheetTrigger,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@ui/components/ui/sheet'

/**
 * Basic sheet demo - opens from right side with title and description
 */
export function SheetBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Sheet open={open()} onOpenChange={setOpen}>
        <SheetTrigger>
          Open Sheet
        </SheetTrigger>
        <SheetOverlay />
        <SheetContent
          side="right"
          ariaLabelledby="sheet-basic-title"
          ariaDescribedby="sheet-basic-description"
        >
          <SheetHeader>
            <SheetTitle id="sheet-basic-title">Sheet Title</SheetTitle>
            <SheetDescription id="sheet-basic-description">
              This is a basic sheet that slides in from the right edge of the screen.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 text-sm text-muted-foreground">
            <p>
              Sheets are useful for navigation menus, settings panels, and forms
              that complement the main content.
            </p>
          </div>
          <SheetFooter>
            <SheetClose>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/**
 * Side variants demo - shows all 4 side options
 */
export function SheetSideDemo() {
  const [openTop, setOpenTop] = createSignal(false)
  const [openRight, setOpenRight] = createSignal(false)
  const [openBottom, setOpenBottom] = createSignal(false)
  const [openLeft, setOpenLeft] = createSignal(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Sheet open={openTop()} onOpenChange={setOpenTop}>
        <SheetTrigger>Top</SheetTrigger>
        <SheetOverlay />
        <SheetContent
          side="top"
          ariaLabelledby="sheet-top-title"
        >
          <SheetHeader>
            <SheetTitle id="sheet-top-title">Top Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the top.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={openRight()} onOpenChange={setOpenRight}>
        <SheetTrigger>Right</SheetTrigger>
        <SheetOverlay />
        <SheetContent
          side="right"
          ariaLabelledby="sheet-right-title"
        >
          <SheetHeader>
            <SheetTitle id="sheet-right-title">Right Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the right.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={openBottom()} onOpenChange={setOpenBottom}>
        <SheetTrigger>Bottom</SheetTrigger>
        <SheetOverlay />
        <SheetContent
          side="bottom"
          ariaLabelledby="sheet-bottom-title"
        >
          <SheetHeader>
            <SheetTitle id="sheet-bottom-title">Bottom Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the bottom.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={openLeft()} onOpenChange={setOpenLeft}>
        <SheetTrigger>Left</SheetTrigger>
        <SheetOverlay />
        <SheetContent
          side="left"
          ariaLabelledby="sheet-left-title"
        >
          <SheetHeader>
            <SheetTitle id="sheet-left-title">Left Sheet</SheetTitle>
            <SheetDescription>This sheet slides in from the left.</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose>Close</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/**
 * Profile edit form inside sheet demo
 */
export function SheetFormDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Sheet open={open()} onOpenChange={setOpen}>
        <SheetTrigger>Edit Profile</SheetTrigger>
        <SheetOverlay />
        <SheetContent
          side="right"
          ariaLabelledby="sheet-form-title"
          ariaDescribedby="sheet-form-description"
        >
          <SheetHeader>
            <SheetTitle id="sheet-form-title">Edit Profile</SheetTitle>
            <SheetDescription id="sheet-form-description">
              Make changes to your profile here. Click save when you're done.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label for="sheet-name" className="text-right text-sm font-medium">
                Name
              </label>
              <input
                id="sheet-name"
                type="text"
                value="John Doe"
                className="col-span-3 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label for="sheet-username" className="text-right text-sm font-medium">
                Username
              </label>
              <input
                id="sheet-username"
                type="text"
                value="@johndoe"
                className="col-span-3 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <SheetFooter>
            <SheetClose>Cancel</SheetClose>
            <SheetClose>Save changes</SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
