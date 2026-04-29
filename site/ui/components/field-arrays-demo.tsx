"use client"
/**
 * FieldArraysDemo Components
 *
 * Dynamic array fields. createForm targets fixed-shape records, so the array
 * itself is held in a signal; createForm + the same Zod schema power
 * submit-time validation, while the per-item live feedback reuses the schema.
 *
 * Note: signal-based loops use native HTML inputs/buttons rather than the
 * `<Input>` / `<Button>` components — components cannot be created from a
 * loop template (see html-template.ts).
 */

import { createForm } from '@barefootjs/form'
import { createSignal, createMemo } from '@barefootjs/client'
import { Button } from '@ui/components/ui/button'
import { z } from 'zod'

// Shared per-item Zod schema — used for live feedback AND inside createForm
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')

function validateEmail(value: string): string {
  const result = emailSchema.safeParse(value)
  return result.success ? '' : result.error.issues[0]?.message ?? ''
}

// Input styles (matching @ui/components/ui/input)
const inputClasses = 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

// Remove button styles (matching @ui/components/ui/button variant=destructive size=icon)
const removeButtonClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive touch-action-manipulation bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 size-9'

/**
 * Basic field array — createForm holds an `emails: string[]` field; touched
 * state and per-item errors are derived locally so individual blur events
 * trigger feedback without re-running the whole form.
 */
export function BasicFieldArrayDemo() {
  const [touched, setTouched] = createSignal<boolean[]>([false])
  const [submitAttempted, setSubmitAttempted] = createSignal(false)
  const [submitted, setSubmitted] = createSignal<string[] | null>(null)

  const form = createForm({
    schema: z.object({ emails: z.array(emailSchema).min(1) }),
    defaultValues: { emails: [''] },
    onSubmit: async (data) => {
      setSubmitted(data.emails as string[])
    },
  })

  const emails = form.field('emails')

  const itemError = (i: number): string => {
    if (!touched()[i] && !submitAttempted()) return ''
    return validateEmail(emails.value()[i] ?? '')
  }

  const handleAdd = () => {
    emails.setValue([...emails.value(), ''])
    setTouched([...touched(), false])
  }

  const handleRemove = (i: number) => {
    if (emails.value().length > 1) {
      emails.setValue(emails.value().filter((_, idx) => idx !== i))
      setTouched(touched().filter((_, idx) => idx !== i))
    }
  }

  const handleChange = (i: number, value: string) => {
    emails.setValue(emails.value().map((e, idx) => (idx === i ? value : e)))
  }

  const handleBlur = (i: number) => {
    setTouched(touched().map((t, idx) => (idx === i ? true : t)))
  }

  const handleSubmit = async (e: Event) => {
    setSubmitAttempted(true)
    await form.handleSubmit(e)
  }

  return (
    <div className="space-y-4">
      {submitted() ? (
        <div className="success-message p-4 bg-success/10 border border-success rounded-lg">
          <p className="text-success font-medium">Emails submitted successfully!</p>
          <p className="text-sm text-muted-foreground mt-2">{submitted()!.join(', ')}</p>
        </div>
      ) : null}

      {!submitted() ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field-list space-y-3">
            {emails.value().map((value, index) => (
              <div key={index} className="field-item flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    type="email"
                    data-slot="input"
                    className={inputClasses}
                    value={value}
                    placeholder={`Email ${index + 1}`}
                    onInput={(e) => handleChange(index, (e.target as HTMLInputElement).value)}
                    onBlur={() => handleBlur(index)}
                  />
                  <p className="field-error text-sm text-destructive min-h-5">{itemError(index)}</p>
                </div>
                <button
                  type="button"
                  data-slot="button"
                  className={removeButtonClasses}
                  disabled={emails.value().length <= 1}
                  onClick={() => handleRemove(index)}
                >
                  X
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleAdd}>
              + Add Email
            </Button>
            <Button type="submit" disabled={form.isSubmitting()}>
              {form.isSubmitting() ? 'Submitting...' : 'Submit'}
            </Button>
          </div>

          <p className="field-count text-sm text-muted-foreground">
            {emails.value().length} email(s) added
          </p>
        </form>
      ) : null}
    </div>
  )
}

/**
 * Duplicate detection — adds a cross-item rule on top of per-item validation.
 */
export function DuplicateValidationDemo() {
  const [touched, setTouched] = createSignal<boolean[]>([false, false])

  const form = createForm({
    schema: z.object({ emails: z.array(emailSchema) }),
    defaultValues: { emails: ['', ''] },
  })

  const emails = form.field('emails')

  const duplicateCount = createMemo(() => {
    const values = emails.value().map((v) => v.toLowerCase().trim()).filter((v) => v !== '')
    return values.length - new Set(values).size
  })

  const itemError = (i: number): string => {
    if (!touched()[i]) return ''
    const value = emails.value()[i] ?? ''
    const basic = validateEmail(value)
    if (basic) return basic
    const lower = value.toLowerCase()
    const isDup = emails.value().some((other, idx) => idx !== i && other.toLowerCase() === lower)
    return isDup ? 'Duplicate email' : ''
  }

  const handleAdd = () => {
    emails.setValue([...emails.value(), ''])
    setTouched([...touched(), false])
  }

  const handleRemove = (i: number) => {
    if (emails.value().length > 1) {
      emails.setValue(emails.value().filter((_, idx) => idx !== i))
      setTouched(touched().filter((_, idx) => idx !== i))
    }
  }

  const handleChange = (i: number, value: string) => {
    emails.setValue(emails.value().map((e, idx) => (idx === i ? value : e)))
  }

  const handleBlur = (i: number) => {
    setTouched(touched().map((t, idx) => (idx === i ? true : t)))
  }

  return (
    <div className="space-y-4">
      <div className="field-list space-y-3">
        {emails.value().map((value, index) => (
          <div key={index} className="field-item flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <input
                type="email"
                data-slot="input"
                className={inputClasses}
                value={value}
                placeholder={`Email ${index + 1}`}
                onInput={(e) => handleChange(index, (e.target as HTMLInputElement).value)}
                onBlur={() => handleBlur(index)}
              />
              <p className="field-error text-sm text-destructive min-h-5">{itemError(index)}</p>
            </div>
            <button
              type="button"
              data-slot="button"
              className={removeButtonClasses}
              disabled={emails.value().length <= 1}
              onClick={() => handleRemove(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={handleAdd}>
        + Add Email
      </Button>

      {duplicateCount() > 0 ? (
        <p className="duplicate-warning text-sm text-warning">
          {duplicateCount()} duplicate email(s) detected
        </p>
      ) : null}
    </div>
  )
}

/**
 * Min/max constraints — derived from `emails.value().length`.
 */
export function MinMaxFieldsDemo() {
  const MIN_FIELDS = 1
  const MAX_FIELDS = 5

  const [touched, setTouched] = createSignal<boolean[]>([false])

  const form = createForm({
    schema: z.object({ emails: z.array(emailSchema).min(MIN_FIELDS).max(MAX_FIELDS) }),
    defaultValues: { emails: [''] },
  })

  const emails = form.field('emails')
  const canAdd = createMemo(() => emails.value().length < MAX_FIELDS)
  const canRemove = createMemo(() => emails.value().length > MIN_FIELDS)

  const itemError = (i: number): string => {
    if (!touched()[i]) return ''
    return validateEmail(emails.value()[i] ?? '')
  }

  const handleAdd = () => {
    if (canAdd()) {
      emails.setValue([...emails.value(), ''])
      setTouched([...touched(), false])
    }
  }

  const handleRemove = (i: number) => {
    if (canRemove()) {
      emails.setValue(emails.value().filter((_, idx) => idx !== i))
      setTouched(touched().filter((_, idx) => idx !== i))
    }
  }

  const handleChange = (i: number, value: string) => {
    emails.setValue(emails.value().map((e, idx) => (idx === i ? value : e)))
  }

  const handleBlur = (i: number) => {
    setTouched(touched().map((t, idx) => (idx === i ? true : t)))
  }

  return (
    <div className="space-y-4">
      <div className="field-list space-y-3">
        {emails.value().map((value, index) => (
          <div key={index} className="field-item flex gap-2 items-start">
            <div className="flex-1 space-y-1">
              <input
                type="email"
                data-slot="input"
                className={inputClasses}
                value={value}
                placeholder={`Email ${index + 1}`}
                onInput={(e) => handleChange(index, (e.target as HTMLInputElement).value)}
                onBlur={() => handleBlur(index)}
              />
              <p className="field-error text-sm text-destructive min-h-5">{itemError(index)}</p>
            </div>
            <button
              type="button"
              data-slot="button"
              className={removeButtonClasses}
              disabled={!canRemove()}
              onClick={() => handleRemove(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleAdd} disabled={!canAdd()}>
          + Add Email
        </Button>
        <p className="field-count text-sm text-muted-foreground">
          {emails.value().length} / {MAX_FIELDS} emails
        </p>
      </div>

      {!canAdd() ? (
        <p className="max-warning text-sm text-warning">
          Maximum {MAX_FIELDS} emails allowed
        </p>
      ) : null}
    </div>
  )
}
