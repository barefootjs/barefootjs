"use client"
/**
 * ToggleGroup Props Playground
 *
 * Interactive playground for the ToggleGroup component.
 * Allows tweaking type, variant, size, and disabled props with live preview.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr, hlStr } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Checkbox } from '@ui/components/ui/checkbox'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@ui/components/ui/toggle-group'

type GroupType = 'single' | 'multiple'
type GroupVariant = 'default' | 'outline'
type GroupSize = 'default' | 'sm' | 'lg'

function highlightToggleGroupJsx(type: string, variant: string, size: string, disabled: boolean): string {
  const props: string[] = []
  props.push(` ${hlAttr('type')}${hlPlain('=')}${hlStr(`&quot;${type}&quot;`)}`)
  if (variant !== 'default') props.push(` ${hlAttr('variant')}${hlPlain('=')}${hlStr(`&quot;${variant}&quot;`)}`)
  if (size !== 'default') props.push(` ${hlAttr('size')}${hlPlain('=')}${hlStr(`&quot;${size}&quot;`)}`)
  if (disabled) props.push(` ${hlAttr('disabled')}`)

  return [
    `${hlPlain('&lt;')}${hlTag('ToggleGroup')}${props.join('')}${hlPlain('&gt;')}`,
    `  ${hlPlain('&lt;')}${hlTag('ToggleGroupItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;a&quot;')}${hlPlain('&gt;')}A${hlPlain('&lt;/')}${hlTag('ToggleGroupItem')}${hlPlain('&gt;')}`,
    `  ${hlPlain('&lt;')}${hlTag('ToggleGroupItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;b&quot;')}${hlPlain('&gt;')}B${hlPlain('&lt;/')}${hlTag('ToggleGroupItem')}${hlPlain('&gt;')}`,
    `  ${hlPlain('&lt;')}${hlTag('ToggleGroupItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;c&quot;')}${hlPlain('&gt;')}C${hlPlain('&lt;/')}${hlTag('ToggleGroupItem')}${hlPlain('&gt;')}`,
    `${hlPlain('&lt;/')}${hlTag('ToggleGroup')}${hlPlain('&gt;')}`,
  ].join('\n')
}

function ToggleGroupPlayground(_props: {}) {
  const [type, setType] = createSignal<GroupType>('single')
  const [variant, setVariant] = createSignal<GroupVariant>('default')
  const [size, setSize] = createSignal<GroupSize>('default')
  const [disabled, setDisabled] = createSignal(false)

  const codeText = createMemo(() => {
    const parts: string[] = [`type="${type()}"`]
    if (variant() !== 'default') parts.push(`variant="${variant()}"`)
    if (size() !== 'default') parts.push(`size="${size()}"`)
    if (disabled()) parts.push('disabled')
    return `<ToggleGroup ${parts.join(' ')}>\n  <ToggleGroupItem value="a">A</ToggleGroupItem>\n  <ToggleGroupItem value="b">B</ToggleGroupItem>\n  <ToggleGroupItem value="c">C</ToggleGroupItem>\n</ToggleGroup>`
  })

  createEffect(() => {
    const t = type()
    const v = variant()
    const s = size()
    const d = disabled()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      codeEl.innerHTML = highlightToggleGroupJsx(t, v, s, d)
    }
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-toggle-group-preview"
      previewContent={
        <ToggleGroup type={type()} variant={variant()} size={size()} disabled={disabled()} defaultValue="a">
          <ToggleGroupItem value="a">A</ToggleGroupItem>
          <ToggleGroupItem value="b">B</ToggleGroupItem>
          <ToggleGroupItem value="c">C</ToggleGroupItem>
        </ToggleGroup>
      }
      controls={<>
        <PlaygroundControl label="type">
          <Select value={type()} onValueChange={(v: string) => setType(v as GroupType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">single</SelectItem>
              <SelectItem value="multiple">multiple</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="variant">
          <Select value={variant()} onValueChange={(v: string) => setVariant(v as GroupVariant)}>
            <SelectTrigger>
              <SelectValue placeholder="Select variant..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">default</SelectItem>
              <SelectItem value="outline">outline</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="size">
          <Select value={size()} onValueChange={(v: string) => setSize(v as GroupSize)}>
            <SelectTrigger>
              <SelectValue placeholder="Select size..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">default</SelectItem>
              <SelectItem value="sm">sm</SelectItem>
              <SelectItem value="lg">lg</SelectItem>
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

export { ToggleGroupPlayground }
