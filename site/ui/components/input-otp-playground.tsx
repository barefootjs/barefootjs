"use client"
/**
 * InputOTP Props Playground
 *
 * Interactive playground for the InputOTP component.
 * Allows tweaking maxLength and disabled props with live preview.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr, hlStr } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Checkbox } from '@ui/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@ui/components/ui/input-otp'

function highlightInputOTPJsx(maxLength: number, disabled: boolean): string {
  const disabledProp = disabled ? ` ${hlAttr('disabled')}` : ''
  const lines = [
    `${hlPlain('&lt;')}${hlTag('InputOTP')} ${hlAttr('maxLength')}${hlPlain('={')}${maxLength}${hlPlain('}')}${disabledProp}${hlPlain('&gt;')}`,
  ]

  if (maxLength === 4) {
    lines.push(`  ${hlPlain('&lt;')}${hlTag('InputOTPGroup')}${hlPlain('&gt;')}`)
    for (let i = 0; i < 4; i++) {
      lines.push(`    ${hlPlain('&lt;')}${hlTag('InputOTPSlot')} ${hlAttr('index')}${hlPlain('={')}${i}${hlPlain('}')} ${hlPlain('/&gt;')}`)
    }
    lines.push(`  ${hlPlain('&lt;/')}${hlTag('InputOTPGroup')}${hlPlain('&gt;')}`)
  } else {
    const half = Math.floor(maxLength / 2)
    lines.push(`  ${hlPlain('&lt;')}${hlTag('InputOTPGroup')}${hlPlain('&gt;')}`)
    for (let i = 0; i < half; i++) {
      lines.push(`    ${hlPlain('&lt;')}${hlTag('InputOTPSlot')} ${hlAttr('index')}${hlPlain('={')}${i}${hlPlain('}')} ${hlPlain('/&gt;')}`)
    }
    lines.push(`  ${hlPlain('&lt;/')}${hlTag('InputOTPGroup')}${hlPlain('&gt;')}`)
    lines.push(`  ${hlPlain('&lt;')}${hlTag('InputOTPSeparator')} ${hlPlain('/&gt;')}`)
    lines.push(`  ${hlPlain('&lt;')}${hlTag('InputOTPGroup')}${hlPlain('&gt;')}`)
    for (let i = half; i < maxLength; i++) {
      lines.push(`    ${hlPlain('&lt;')}${hlTag('InputOTPSlot')} ${hlAttr('index')}${hlPlain('={')}${i}${hlPlain('}')} ${hlPlain('/&gt;')}`)
    }
    lines.push(`  ${hlPlain('&lt;/')}${hlTag('InputOTPGroup')}${hlPlain('&gt;')}`)
  }

  lines.push(`${hlPlain('&lt;/')}${hlTag('InputOTP')}${hlPlain('&gt;')}`)
  return lines.join('\n')
}

function InputOTPPlayground(_props: {}) {
  const [maxLength, setMaxLength] = createSignal('6')
  const [disabled, setDisabled] = createSignal(false)

  const maxLengthNum = createMemo(() => parseInt(maxLength(), 10))

  const codeText = createMemo(() => {
    const ml = maxLengthNum()
    const parts: string[] = [`maxLength={${ml}}`]
    if (disabled()) parts.push('disabled')
    return `<InputOTP ${parts.join(' ')}>...</InputOTP>`
  })

  createEffect(() => {
    const ml = maxLengthNum()
    const d = disabled()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      codeEl.innerHTML = highlightInputOTPJsx(ml, d)
    }
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-input-otp-preview"
      previewContent={
        <InputOTP maxLength={maxLengthNum()} disabled={disabled()}>
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
      }
      controls={<>
        <PlaygroundControl label="maxLength">
          <Select value={maxLength()} onValueChange={(v: string) => setMaxLength(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select length..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="6">6</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="disabled">
          <Checkbox
            checked={disabled()}
            onCheckedChange={setDisabled}
          />
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={codeText()} />}
    />
  )
}

export { InputOTPPlayground }
