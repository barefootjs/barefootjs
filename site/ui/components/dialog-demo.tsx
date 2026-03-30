"use client"
/**
 * DialogDemo Components
 *
 * Interactive demos for Dialog component.
 * Used in dialog documentation page.
 */

import { createSignal, createEffect, onCleanup } from '@barefootjs/dom'
import {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@ui/components/ui/dialog'

/**
 * Create task dialog demo - typical dialog with form
 */
export function DialogBasicDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogTrigger>
          Create Task
        </DialogTrigger>
        <DialogOverlay />
        <DialogContent
          ariaLabelledby="dialog-title"
          ariaDescribedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="dialog-title">Create New Task</DialogTitle>
            <DialogDescription id="dialog-description">
              Add a new task to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label for="task-title" className="text-sm font-medium">
                Title
              </label>
              <input
                id="task-title"
                type="text"
                placeholder="Enter task title"
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid gap-2">
              <label for="task-description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="task-description"
                placeholder="Enter task description (optional)"
                rows={3}
                className="flex w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <DialogClose>Create</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Delete confirmation dialog demo (GitHub-style)
 *
 * Uses reactive binding for form elements inside portal.
 * Note: Portal elements need special handling because find() is called during
 * hydration before Portal mounts. We use createEffect with DOM query to set up
 * handlers after elements are available.
 */
export function DialogFormDemo() {
  const [open, setOpen] = createSignal(false)
  const [confirmText, setConfirmText] = createSignal('')
  const projectName = 'my-project'
  const isConfirmed = () => confirmText() === projectName

  const handleDelete = () => {
    if (isConfirmed()) {
      setOpen(false)
      setConfirmText('')
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setConfirmText('')
  }

  // Set up handlers for Portal elements after they're mounted
  createEffect(() => {
    if (!open()) return

    // Wait for next frame to ensure Portal has mounted
    const frame = requestAnimationFrame(() => {
      const input = document.getElementById('confirm-project-name') as HTMLInputElement
      const btn = document.getElementById('delete-project-button') as HTMLButtonElement
      if (!input || !btn) return

      // Reset input on open
      input.value = ''
      setConfirmText('')

      // Set up input handler
      const handleInput = () => setConfirmText(input.value)
      input.addEventListener('input', handleInput)

      // Set up button click handler (needed because Portal moves element after hydration)
      btn.onclick = handleDelete

      // Set up reactive disabled effect
      createEffect(() => {
        btn.disabled = !isConfirmed()
      })

      onCleanup(() => {
        input.removeEventListener('input', handleInput)
      })
    })

    onCleanup(() => cancelAnimationFrame(frame))
  })

  return (
    <div>
      <Dialog open={open()} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Project
          </button>
        </DialogTrigger>
        <DialogOverlay />
        <DialogContent
          ariaLabelledby="delete-dialog-title"
          ariaDescribedby="delete-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="delete-dialog-title">Delete Project</DialogTitle>
            <DialogDescription id="delete-dialog-description">
              This action cannot be undone. This will permanently delete the <strong className="text-foreground">{projectName}</strong> project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label for="confirm-project-name" className="text-sm text-muted-foreground">
              Please type <strong className="text-foreground">{projectName}</strong> to confirm.
            </label>
            <input
              id="confirm-project-name"
              type="text"
              placeholder={projectName}
              value={confirmText()}
              onInput={(e) => setConfirmText((e.target as HTMLInputElement).value)}
              className="mt-2 flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <button
              type="button"
              id="delete-project-button"
              disabled={!isConfirmed()}
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
            >
              Delete Project
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Dialog with long content demo
 */
export function DialogLongContentDemo() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogTrigger>
          Open Long Content Dialog
        </DialogTrigger>
        <DialogOverlay />
        <DialogContent
          ariaLabelledby="long-dialog-title"
          ariaDescribedby="long-dialog-description"
          className="max-h-[66vh]"
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle id="long-dialog-title">Terms of Service</DialogTitle>
            <DialogDescription id="long-dialog-description">
              Please read the following terms carefully.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-4 overflow-y-auto flex-1 min-h-0">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            </p>
            <p>
              Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
            </p>
            <p>
              Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
            </p>
            <p>
              Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?
            </p>
            <p>
              Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
            </p>
            <p>
              At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
            </p>
          </div>
          <DialogFooter className="flex-shrink-0">
            <DialogClose>Decline</DialogClose>
            <DialogClose>Accept</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
