"use client"
/**
 * Combobox Props Playground
 *
 * Interactive playground for the Combobox component.
 * Allows tweaking placeholder and disabled props with live preview.
 *
 * Since Combobox is a compound component, the preview renders
 * a ComboboxTrigger-equivalent button (matching the real component's classes).
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr, hlStr, escapeHtml } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Input } from '@ui/components/ui/input'
import { Checkbox } from '@ui/components/ui/checkbox'

// Mirror of ComboboxTrigger class definitions (ui/components/ui/combobox/index.tsx)
const triggerBaseClasses = 'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none'
const triggerFocusClasses = 'focus:border-ring focus:ring-ring/50 focus:ring-[3px]'
const triggerDisabledClasses = 'disabled:cursor-not-allowed disabled:opacity-50'

function ComboboxPlayground(_props: {}) {
  const [placeholder, setPlaceholder] = createSignal('Select framework...')
  const [disabled, setDisabled] = createSignal(false)

  const codeText = createMemo(() => {
    const p = placeholder()
    const d = disabled()
    const placeholderAttr = p ? ` placeholder="${p}"` : ''
    const disabledAttr = d ? ' disabled' : ''
    return `<Combobox>\n  <ComboboxTrigger${disabledAttr}>\n    <ComboboxValue${placeholderAttr} />\n  </ComboboxTrigger>\n  <ComboboxContent>\n    <ComboboxInput placeholder="Search..." />\n    <ComboboxItem value="next">Next.js</ComboboxItem>\n    <ComboboxItem value="svelte">SvelteKit</ComboboxItem>\n  </ComboboxContent>\n</Combobox>`
  })

  createEffect(() => {
    const p = placeholder()
    const d = disabled()

    // Update combobox trigger preview
    const container = document.querySelector('[data-combobox-preview]') as HTMLElement
    if (container) {
      const btn = document.createElement('button')
      btn.setAttribute('type', 'button')
      btn.setAttribute('role', 'combobox')
      btn.setAttribute('data-placeholder', '')
      btn.className = `${triggerBaseClasses} ${triggerFocusClasses} ${triggerDisabledClasses} w-[280px]`
      if (d) btn.disabled = true

      const span = document.createElement('span')
      span.className = 'pointer-events-none truncate text-muted-foreground'
      span.textContent = p || ''
      btn.appendChild(span)

      // Chevron icon
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
      btn.appendChild(svg)

      container.innerHTML = ''
      container.appendChild(btn)
    }

    // Update highlighted code
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      const disabledProp = d ? ` ${hlAttr('disabled')}` : ''
      const placeholderProp = p
        ? ` ${hlAttr('placeholder')}${hlPlain('=')}${hlStr(`&quot;${escapeHtml(p)}&quot;`)}`
        : ''
      const lines = [
        `${hlPlain('&lt;')}${hlTag('Combobox')}${hlPlain('&gt;')}`,
        `  ${hlPlain('&lt;')}${hlTag('ComboboxTrigger')}${disabledProp}${hlPlain('&gt;')}`,
        `    ${hlPlain('&lt;')}${hlTag('ComboboxValue')}${placeholderProp} ${hlPlain('/&gt;')}`,
        `  ${hlPlain('&lt;/')}${hlTag('ComboboxTrigger')}${hlPlain('&gt;')}`,
        `  ${hlPlain('&lt;')}${hlTag('ComboboxContent')}${hlPlain('&gt;')}`,
        `    ${hlPlain('...')}`,
        `  ${hlPlain('&lt;/')}${hlTag('ComboboxContent')}${hlPlain('&gt;')}`,
        `${hlPlain('&lt;/')}${hlTag('Combobox')}${hlPlain('&gt;')}`,
      ]
      codeEl.innerHTML = lines.join('\n')
    }
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-combobox-preview"
      controls={<>
        <PlaygroundControl label="placeholder">
          <Input
            type="text"
            value="Select framework..."
            onInput={(e: Event) => setPlaceholder((e.target as HTMLInputElement).value)}
          />
        </PlaygroundControl>
        <PlaygroundControl label="disabled">
          <Checkbox
            defaultChecked={false}
            onCheckedChange={(checked: boolean) => setDisabled(checked)}
          />
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={codeText()} />}
    />
  )
}

export { ComboboxPlayground }
