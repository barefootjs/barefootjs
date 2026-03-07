"use client"
/**
 * Slider Props Playground
 *
 * Interactive playground for the Slider component.
 * Allows tweaking defaultValue, min, max, step, and disabled props with live preview.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Checkbox } from '@ui/components/ui/checkbox'
import { Slider } from '@ui/components/ui/slider'

function highlightSliderJsx(value: number, disabled: boolean): string {
  const props: string[] = []
  if (value !== 50) props.push(` ${hlAttr('defaultValue')}${hlPlain('={')}${value}${hlPlain('}')}`)
  if (disabled) props.push(` ${hlAttr('disabled')}`)
  return `${hlPlain('&lt;')}${hlTag('Slider')}${props.join('')} ${hlPlain('/&gt;')}`
}

function SliderPlayground(_props: {}) {
  const [value, setValue] = createSignal(50)
  const [disabled, setDisabled] = createSignal(false)

  const codeText = createMemo(() => {
    const parts: string[] = []
    if (value() !== 50) parts.push(`defaultValue={${value()}}`)
    if (disabled()) parts.push('disabled')
    const propsStr = parts.length > 0 ? ` ${parts.join(' ')}` : ''
    return `<Slider${propsStr} />`
  })

  createEffect(() => {
    const v = value()
    const d = disabled()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      codeEl.innerHTML = highlightSliderJsx(v, d)
    }
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-slider-preview"
      previewContent={
        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium leading-none">Value</span>
            <span className="text-sm text-muted-foreground tabular-nums">{value()}</span>
          </div>
          <Slider value={value()} onValueChange={setValue} disabled={disabled()} />
        </div>
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

export { SliderPlayground }
