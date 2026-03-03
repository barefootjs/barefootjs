"use client"
/**
 * InputOTP Demo Components
 *
 * Interactive demos for Input OTP component.
 * Based on shadcn/ui patterns for practical use cases.
 */

import { createSignal, createMemo, onCleanup } from '@barefootjs/dom'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@ui/components/ui/input-otp'

// Defined locally because @ui/ alias is not resolvable in client-side JS
const REGEXP_ONLY_DIGITS_AND_CHARS = /^[a-zA-Z0-9]+$/

/**
 * Preview: 6-digit OTP with separator (groups of 3)
 * Hero demo shown at the top of the docs page
 */
export function InputOTPPreviewDemo() {
  const [value, setValue] = createSignal('')

  return (
    <div className="flex flex-col items-center gap-4">
      <InputOTP maxLength={6} value={value()} onValueChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-muted-foreground">
        Enter your 6-digit code.
      </p>
    </div>
  )
}

/**
 * Basic: Simple 4-digit numeric OTP
 */
export function InputOTPBasicDemo() {
  return (
    <div>
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  )
}

/**
 * Pattern: Alphanumeric OTP with REGEXP_ONLY_DIGITS_AND_CHARS
 */
export function InputOTPPatternDemo() {
  return (
    <div className="space-y-2">
      <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-muted-foreground">
        Accepts letters and numbers.
      </p>
    </div>
  )
}

/**
 * Form: OTP verification form with submit, success/error feedback,
 * and resend code countdown timer
 */
export function InputOTPFormDemo() {
  const [value, setValue] = createSignal('')
  const [status, setStatus] = createSignal<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [canResend, setCanResend] = createSignal(true)
  const [countdown, setCountdown] = createSignal(0)

  const isComplete = createMemo(() => value().length === 6)

  const handleSubmit = () => {
    if (!isComplete()) return
    setStatus('loading')

    // Simulate verification
    setTimeout(() => {
      if (value() === '123456') {
        setStatus('success')
      } else {
        setStatus('error')
      }
    }, 1500)
  }

  const handleResend = () => {
    if (!canResend()) return
    setCanResend(false)
    setCountdown(30)
    setValue('')
    setStatus('idle')

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    onCleanup(() => clearInterval(timer))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium leading-none">Verification Code</h4>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to your phone. Try <code className="text-xs bg-muted px-1 py-0.5 rounded">123456</code> to see success.
        </p>
      </div>

      <InputOTP maxLength={6} value={value()} onValueChange={setValue} disabled={status() === 'loading' || status() === 'success'}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>

      <div className="flex items-center gap-3">
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          disabled={!isComplete() || status() === 'loading' || status() === 'success'}
          onClick={handleSubmit}
        >
          {status() === 'loading' ? 'Verifying...' : 'Verify'}
        </button>

        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={!canResend()}
          onClick={handleResend}
        >
          {canResend() ? 'Resend code' : `Resend in ${countdown()}s`}
        </button>
      </div>

      {status() === 'success' && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Code verified successfully!
        </p>
      )}
      {status() === 'error' && (
        <p className="text-sm text-destructive">
          Invalid code. Please try again.
        </p>
      )}
    </div>
  )
}
