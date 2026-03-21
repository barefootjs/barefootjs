"use client"
/**
 * FieldDemo Components
 *
 * Interactive demos for Field component.
 * Shows form field patterns with label, description, and error.
 */

import { createSignal } from '@barefootjs/dom'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldSet, FieldLegend, FieldGroup } from '@ui/components/ui/field'
import { Input } from '@ui/components/ui/input'
import { Checkbox } from '@ui/components/ui/checkbox'

/**
 * Basic vertical field with label, input, and description
 */
export function FieldBasicDemo() {
  return (
    <div className="space-y-4 max-w-sm">
      <Field>
        <FieldLabel for="email">Email</FieldLabel>
        <FieldContent>
          <Input id="email" type="email" placeholder="you@example.com" />
          <FieldDescription>We'll never share your email.</FieldDescription>
        </FieldContent>
      </Field>
    </div>
  )
}

/**
 * Field with validation error
 */
export function FieldErrorDemo() {
  const [value, setValue] = createSignal('')
  const [touched, setTouched] = createSignal(false)

  const hasError = () => touched() && value().length === 0

  return (
    <div className="space-y-4 max-w-sm">
      <Field data-invalid={hasError() || undefined}>
        <FieldLabel for="username">Username</FieldLabel>
        <FieldContent>
          <Input
            id="username"
            placeholder="Enter username"
            aria-invalid={hasError() || undefined}
            value={value()}
            onInput={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {hasError() ? (
            <FieldError>Username is required.</FieldError>
          ) : (
            <FieldDescription>Choose a unique username.</FieldDescription>
          )}
        </FieldContent>
      </Field>
    </div>
  )
}

/**
 * Horizontal layout with checkbox
 */
export function FieldHorizontalDemo() {
  const [accepted, setAccepted] = createSignal(false)

  return (
    <div className="space-y-4 max-w-md">
      <Field orientation="horizontal">
        <Checkbox
          checked={accepted()}
          onCheckedChange={setAccepted}
        />
        <FieldContent>
          <FieldLabel>Accept terms and conditions</FieldLabel>
          <FieldDescription>You agree to our Terms of Service and Privacy Policy.</FieldDescription>
        </FieldContent>
      </Field>
      <p className="text-sm text-muted-foreground">
        Status: <span className="font-medium">{accepted() ? 'Accepted' : 'Not accepted'}</span>
      </p>
    </div>
  )
}

/**
 * Registration form using FieldSet and FieldGroup
 */
export function FieldFormDemo() {
  const [submitted, setSubmitted] = createSignal(false)

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <form className="max-w-sm" onSubmit={handleSubmit}>
      <FieldSet>
        <FieldLegend>Create Account</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel for="reg-name">Full Name</FieldLabel>
            <FieldContent>
              <Input id="reg-name" placeholder="John Doe" />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel for="reg-email">Email</FieldLabel>
            <FieldContent>
              <Input id="reg-email" type="email" placeholder="john@example.com" />
              <FieldDescription>We'll send a verification email.</FieldDescription>
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel for="reg-password">Password</FieldLabel>
            <FieldContent>
              <Input id="reg-password" type="password" placeholder="••••••••" />
              <FieldDescription>Must be at least 8 characters.</FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>
      <div className="mt-6">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Create Account
        </button>
        {submitted() && (
          <p className="mt-2 text-sm text-muted-foreground">Form submitted!</p>
        )}
      </div>
    </form>
  )
}
