"use client"
/**
 * DrawerDemo Components
 *
 * Interactive demos for Drawer component.
 * Used in drawer documentation page.
 */

import { createSignal } from '@barefootjs/dom'
import {
  Drawer,
  DrawerTrigger,
  DrawerOverlay,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@ui/components/ui/drawer'

/**
 * Basic drawer demo - opens from bottom with handle and title
 */
export function DrawerBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Drawer open={open()} onOpenChange={setOpen}>
        <DrawerTrigger>
          Open Drawer
        </DrawerTrigger>
        <DrawerOverlay />
        <DrawerContent
          direction="bottom"
          ariaLabelledby="drawer-basic-title"
          ariaDescribedby="drawer-basic-description"
        >
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle id="drawer-basic-title">Move Goal</DrawerTitle>
            <DrawerDescription id="drawer-basic-description">
              Set your daily move goal.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-7xl font-bold tracking-tighter">350</span>
              <span className="text-muted-foreground text-sm pb-2">kcal/day</span>
            </div>
          </div>
          <DrawerFooter>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
            >
              Submit
            </button>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

/**
 * Direction variants demo - shows all 4 direction options
 */
export function DrawerDirectionDemo() {
  const [openTop, setOpenTop] = createSignal(false)
  const [openRight, setOpenRight] = createSignal(false)
  const [openBottom, setOpenBottom] = createSignal(false)
  const [openLeft, setOpenLeft] = createSignal(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Drawer open={openTop()} onOpenChange={setOpenTop}>
        <DrawerTrigger>Top</DrawerTrigger>
        <DrawerOverlay />
        <DrawerContent
          direction="top"
          ariaLabelledby="drawer-top-title"
        >
          <DrawerHeader>
            <DrawerTitle id="drawer-top-title">Top Drawer</DrawerTitle>
            <DrawerDescription>This drawer slides in from the top.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={openRight()} onOpenChange={setOpenRight}>
        <DrawerTrigger>Right</DrawerTrigger>
        <DrawerOverlay />
        <DrawerContent
          direction="right"
          ariaLabelledby="drawer-right-title"
        >
          <DrawerHeader>
            <DrawerTitle id="drawer-right-title">Right Drawer</DrawerTitle>
            <DrawerDescription>This drawer slides in from the right.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={openBottom()} onOpenChange={setOpenBottom}>
        <DrawerTrigger>Bottom</DrawerTrigger>
        <DrawerOverlay />
        <DrawerContent
          direction="bottom"
          ariaLabelledby="drawer-bottom-title"
        >
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle id="drawer-bottom-title">Bottom Drawer</DrawerTitle>
            <DrawerDescription>This drawer slides in from the bottom.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={openLeft()} onOpenChange={setOpenLeft}>
        <DrawerTrigger>Left</DrawerTrigger>
        <DrawerOverlay />
        <DrawerContent
          direction="left"
          ariaLabelledby="drawer-left-title"
        >
          <DrawerHeader>
            <DrawerTitle id="drawer-left-title">Left Drawer</DrawerTitle>
            <DrawerDescription>This drawer slides in from the left.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose>Close</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

/**
 * Goal setting form inside drawer demo
 */
export function DrawerFormDemo() {
  const [open, setOpen] = createSignal(false)
  const [goal, setGoal] = createSignal(350)

  const adjustGoal = (amount: number) => {
    setGoal((prev: number) => Math.max(100, prev + amount))
  }

  return (
    <div>
      <Drawer open={open()} onOpenChange={setOpen}>
        <DrawerTrigger>Set Goal</DrawerTrigger>
        <DrawerOverlay />
        <DrawerContent
          direction="bottom"
          ariaLabelledby="drawer-form-title"
          ariaDescribedby="drawer-form-description"
        >
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle id="drawer-form-title">Move Goal</DrawerTitle>
            <DrawerDescription id="drawer-form-description">
              Set your daily activity goal.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border bg-background hover:bg-accent h-10 w-10 text-lg"
                aria-label="Decrease goal"
                onClick={() => adjustGoal(-10)}
              >
                -
              </button>
              <div className="text-center">
                <span className="text-7xl font-bold tracking-tighter">{goal()}</span>
                <p className="text-muted-foreground text-sm mt-1">kcal/day</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border bg-background hover:bg-accent h-10 w-10 text-lg"
                aria-label="Increase goal"
                onClick={() => adjustGoal(10)}
              >
                +
              </button>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 w-full">Submit</DrawerClose>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
