"use client"
/**
 * Input Props Playground
 *
 * Interactive playground for the Input component.
 * Allows tweaking type, placeholder, and disabled props with live preview.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { highlightJsxSelfClosing } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { Input } from '@ui/components/ui/input'

type InputType = 'text' | 'email' | 'password' | 'number'

// Mirror of Input component class definitions (ui/components/ui/input/index.tsx)
const inputBaseClasses = 'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
const inputFocusClasses = 'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
const inputErrorClasses = 'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'

function InputPlayground(_props: {}) {
  const [type, setType] = createSignal<InputType>('text')
  const [placeholder, setPlaceholder] = createSignal('Enter text...')
  const [disabled, setDisabled] = createSignal('false')

  const codeText = createMemo(() => {
    const t = type()
    const p = placeholder()
    const d = disabled()
    const parts: string[] = []
    if (t !== 'text') parts.push(`type="${t}"`)
    if (p) parts.push(`placeholder="${p}"`)
    if (d === 'true') parts.push('disabled')
    const propsStr = parts.length > 0 ? ` ${parts.join(' ')}` : ''
    return `<Input${propsStr} />`
  })

  createEffect(() => {
    const t = type()
    const p = placeholder()
    const d = disabled()

    // Update input preview
    const container = document.querySelector('[data-input-preview]') as HTMLElement
    if (container) {
      const input = document.createElement('input')
      input.setAttribute('type', t)
      input.setAttribute('data-slot', 'input')
      if (p) input.setAttribute('placeholder', p)
      if (d === 'true') input.setAttribute('disabled', '')
      input.className = `${inputBaseClasses} ${inputFocusClasses} ${inputErrorClasses} max-w-sm`
      container.innerHTML = ''
      container.appendChild(input)
    }

    // Update highlighted code
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      const props = [
        { name: 'type', value: t, defaultValue: 'text' },
        { name: 'placeholder', value: p, defaultValue: '' },
        { name: 'disabled', value: d, defaultValue: 'false' },
      ]
      codeEl.innerHTML = highlightJsxSelfClosing('Input', props)
    }
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-input-preview"
      controls={<>
        <PlaygroundControl label="type">
          <Select value={type()} onValueChange={(v: string) => setType(v as InputType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">text</SelectItem>
              <SelectItem value="email">email</SelectItem>
              <SelectItem value="password">password</SelectItem>
              <SelectItem value="number">number</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
        <PlaygroundControl label="placeholder">
          <Input
            type="text"
            value="Enter text..."
            onInput={(e: Event) => setPlaceholder((e.target as HTMLInputElement).value)}
          />
        </PlaygroundControl>
        <PlaygroundControl label="disabled">
          <Select value={disabled()} onValueChange={(v: string) => setDisabled(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="false">false</SelectItem>
              <SelectItem value="true">true</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={codeText()} />}
    />
  )
}

export { InputPlayground }
