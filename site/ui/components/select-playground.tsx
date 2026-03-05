"use client"
/**
 * Select Props Playground
 *
 * Interactive playground for the Select component.
 * Allows tweaking placeholder and disabled props with live preview.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr, hlStr, escapeHtml } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Input } from '@ui/components/ui/input'
import { Checkbox } from '@ui/components/ui/checkbox'

// Mirror of Select component class definitions (ui/components/ui/select/index.tsx)
const selectTriggerBaseClasses = 'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none'
const selectTriggerFocusClasses = 'focus:border-ring focus:ring-ring/50 focus:ring-[3px]'
const selectTriggerDisabledClasses = 'disabled:cursor-not-allowed disabled:opacity-50'
const selectTriggerDataStateClasses = 'data-[placeholder]:text-muted-foreground'

/**
 * Generate syntax-highlighted JSX for the Select compound component.
 */
function highlightSelectJsx(placeholder: string, disabled: boolean): string {
  const disabledAttr = disabled ? ` ${hlAttr('disabled')}` : ''
  const placeholderAttr = placeholder !== 'Select a fruit...'
    ? ` ${hlAttr('placeholder')}${hlPlain('=')}${hlStr(`&quot;${escapeHtml(placeholder)}&quot;`)}`
    : ` ${hlAttr('placeholder')}${hlPlain('=')}${hlStr('&quot;Select a fruit...&quot;')}`

  const lines = [
    `${hlPlain('&lt;')}${hlTag('Select')}${disabledAttr}${hlPlain('&gt;')}`,
    `  ${hlPlain('&lt;')}${hlTag('SelectTrigger')}${hlPlain('&gt;')}`,
    `    ${hlPlain('&lt;')}${hlTag('SelectValue')}${placeholderAttr} ${hlPlain('/&gt;')}`,
    `  ${hlPlain('&lt;/')}${hlTag('SelectTrigger')}${hlPlain('&gt;')}`,
    `  ${hlPlain('&lt;')}${hlTag('SelectContent')}${hlPlain('&gt;')}`,
    `    ${hlPlain('&lt;')}${hlTag('SelectItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;apple&quot;')}${hlPlain('&gt;')}Apple${hlPlain('&lt;/')}${hlTag('SelectItem')}${hlPlain('&gt;')}`,
    `    ${hlPlain('&lt;')}${hlTag('SelectItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;banana&quot;')}${hlPlain('&gt;')}Banana${hlPlain('&lt;/')}${hlTag('SelectItem')}${hlPlain('&gt;')}`,
    `    ${hlPlain('&lt;')}${hlTag('SelectItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;orange&quot;')}${hlPlain('&gt;')}Orange${hlPlain('&lt;/')}${hlTag('SelectItem')}${hlPlain('&gt;')}`,
    `  ${hlPlain('&lt;/')}${hlTag('SelectContent')}${hlPlain('&gt;')}`,
    `${hlPlain('&lt;/')}${hlTag('Select')}${hlPlain('&gt;')}`,
  ]
  return lines.join('\n')
}

function SelectPlayground(_props: {}) {
  const [placeholder, setPlaceholder] = createSignal('Select a fruit...')
  const [disabled, setDisabled] = createSignal(false)

  const codeText = createMemo(() => {
    const p = placeholder()
    const d = disabled()
    const disabledProp = d ? ' disabled' : ''
    return `<Select${disabledProp}>\n  <SelectTrigger>\n    <SelectValue placeholder="${p}" />\n  </SelectTrigger>\n  <SelectContent>\n    <SelectItem value="apple">Apple</SelectItem>\n    <SelectItem value="banana">Banana</SelectItem>\n    <SelectItem value="orange">Orange</SelectItem>\n  </SelectContent>\n</Select>`
  })

  createEffect(() => {
    const p = placeholder()
    const d = disabled()

    // Update select preview
    const container = document.querySelector('[data-select-preview]') as HTMLElement
    if (container) {
      // Rebuild the trigger button to reflect current props
      const btn = document.createElement('button')
      btn.setAttribute('data-slot', 'select-trigger')
      btn.setAttribute('type', 'button')
      btn.setAttribute('role', 'combobox')
      btn.setAttribute('aria-expanded', 'false')
      btn.setAttribute('aria-haspopup', 'listbox')
      btn.setAttribute('data-state', 'closed')
      btn.setAttribute('data-placeholder', '')
      if (d) btn.disabled = true
      btn.className = `${selectTriggerBaseClasses} ${selectTriggerFocusClasses} ${selectTriggerDisabledClasses} ${selectTriggerDataStateClasses}`

      const valueSpan = document.createElement('span')
      valueSpan.setAttribute('data-slot', 'select-value')
      valueSpan.className = 'pointer-events-none truncate'
      valueSpan.textContent = p

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('class', 'size-4 shrink-0 opacity-50')
      svg.setAttribute('viewBox', '0 0 24 24')
      svg.setAttribute('fill', 'none')
      svg.setAttribute('stroke', 'currentColor')
      svg.setAttribute('stroke-width', '2')
      svg.setAttribute('stroke-linecap', 'round')
      svg.setAttribute('stroke-linejoin', 'round')
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', 'm6 9 6 6 6-6')
      svg.appendChild(path)

      btn.appendChild(valueSpan)
      btn.appendChild(svg)

      container.innerHTML = ''
      container.appendChild(btn)
    }

    // Update highlighted code
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      codeEl.innerHTML = highlightSelectJsx(p, d)
    }
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-select-preview"
      controls={<>
        <PlaygroundControl label="placeholder">
          <Input
            type="text"
            value="Select a fruit..."
            onInput={(e: Event) => setPlaceholder((e.target as HTMLInputElement).value)}
          />
        </PlaygroundControl>
        <PlaygroundControl label="disabled">
          <Checkbox
            defaultChecked={false}
            onCheckedChange={(v: boolean) => setDisabled(v)}
          />
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={codeText()} />}
    />
  )
}

export { SelectPlayground }
