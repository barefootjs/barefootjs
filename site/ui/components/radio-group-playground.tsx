"use client"
/**
 * RadioGroup Props Playground
 *
 * Interactive playground for the RadioGroup component.
 * Allows tweaking disabled prop with live preview.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr, hlStr } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Checkbox } from '@ui/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@ui/components/ui/radio-group'

function highlightRadioGroupJsx(disabled: boolean): string {
  const disabledProp = disabled ? ` ${hlAttr('disabled')}` : ''
  return [
    `${hlPlain('&lt;')}${hlTag('RadioGroup')} ${hlAttr('defaultValue')}${hlPlain('=')}${hlStr('&quot;option-1&quot;')}${disabledProp}${hlPlain('&gt;')}`,
    `  ${hlPlain('&lt;')}${hlTag('RadioGroupItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;option-1&quot;')} ${hlPlain('/&gt;')}`,
    `  ${hlPlain('&lt;')}${hlTag('RadioGroupItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;option-2&quot;')} ${hlPlain('/&gt;')}`,
    `${hlPlain('&lt;/')}${hlTag('RadioGroup')}${hlPlain('&gt;')}`,
  ].join('\n')
}

function RadioGroupPlayground(_props: {}) {
  const [disabled, setDisabled] = createSignal(false)

  const codeText = createMemo(() => {
    const parts: string[] = ['defaultValue="option-1"']
    if (disabled()) parts.push('disabled')
    return `<RadioGroup ${parts.join(' ')}>\n  <RadioGroupItem value="option-1" />\n  <RadioGroupItem value="option-2" />\n</RadioGroup>`
  })

  createEffect(() => {
    const d = disabled()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      codeEl.innerHTML = highlightRadioGroupJsx(d)
    }
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-radio-group-preview"
      previewContent={
        <RadioGroup defaultValue="option-1" disabled={disabled()}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-1" />
            <span className="text-sm font-medium leading-none">Option 1</span>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-2" />
            <span className="text-sm font-medium leading-none">Option 2</span>
          </div>
        </RadioGroup>
      }
      controls={<>
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

export { RadioGroupPlayground }
