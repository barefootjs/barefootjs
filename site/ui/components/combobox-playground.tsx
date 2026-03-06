"use client"
/**
 * Combobox Props Playground
 *
 * Interactive playground for the Combobox component.
 * Allows tweaking placeholder and disabled props with live preview.
 *
 * Renders the actual Combobox component (with ComboboxContent) as preview,
 * and uses createEffect to update placeholder/disabled via DOM manipulation.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr, hlStr, escapeHtml } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Input } from '@ui/components/ui/input'
import { Checkbox } from '@ui/components/ui/checkbox'
import {
  Combobox, ComboboxTrigger, ComboboxValue, ComboboxContent,
  ComboboxInput, ComboboxEmpty, ComboboxItem,
} from '@ui/components/ui/combobox'

function ComboboxPlayground(_props: {}) {
  const [value, setValue] = createSignal('')
  const [placeholder, setPlaceholder] = createSignal('Select framework...')
  const [disabled, setDisabled] = createSignal(false)

  const codeText = createMemo(() => {
    const p = placeholder()
    const d = disabled()
    const placeholderAttr = p ? ` placeholder="${p}"` : ''
    const disabledAttr = d ? ' disabled' : ''
    return `<Combobox value={value()} onValueChange={setValue}>
  <ComboboxTrigger${disabledAttr}>
    <ComboboxValue${placeholderAttr} />
  </ComboboxTrigger>
  <ComboboxContent>
    <ComboboxInput placeholder="Search framework..." />
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxItem value="next">Next.js</ComboboxItem>
    <ComboboxItem value="svelte">SvelteKit</ComboboxItem>
    <ComboboxItem value="nuxt">Nuxt</ComboboxItem>
    <ComboboxItem value="remix">Remix</ComboboxItem>
    <ComboboxItem value="astro">Astro</ComboboxItem>
  </ComboboxContent>
</Combobox>`
  })

  createEffect(() => {
    const p = placeholder()
    const d = disabled()

    // Update the live Combobox preview via DOM manipulation.
    // Use requestAnimationFrame to run after the component's own effects.
    requestAnimationFrame(() => {
      const container = document.querySelector('[data-combobox-preview]') as HTMLElement
      if (!container) return

      // Update disabled state on trigger
      const trigger = container.querySelector('[data-slot="combobox-trigger"]') as HTMLButtonElement
      if (trigger) {
        trigger.disabled = d
      }

      // Update placeholder text (only when no value is selected)
      const valueEl = container.querySelector('[data-slot="combobox-value"]') as HTMLElement
      if (valueEl && trigger?.hasAttribute('data-placeholder')) {
        valueEl.textContent = p
      }

      // Update highlighted code
      const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
      if (codeEl) {
        const disabledProp = d ? ` ${hlAttr('disabled')}` : ''
        const placeholderProp = p
          ? ` ${hlAttr('placeholder')}${hlPlain('=')}${hlStr(`&quot;${escapeHtml(p)}&quot;`)}`
          : ''
        const valProp = ` ${hlAttr('value')}${hlPlain('={')}${hlPlain('value()')}${hlPlain('}')}`
        const cbProp = ` ${hlAttr('onValueChange')}${hlPlain('={')}${hlPlain('setValue')}${hlPlain('}')}`
        const lines = [
          `${hlPlain('&lt;')}${hlTag('Combobox')}${valProp}${cbProp}${hlPlain('&gt;')}`,
          `  ${hlPlain('&lt;')}${hlTag('ComboboxTrigger')}${disabledProp}${hlPlain('&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxValue')}${placeholderProp} ${hlPlain('/&gt;')}`,
          `  ${hlPlain('&lt;/')}${hlTag('ComboboxTrigger')}${hlPlain('&gt;')}`,
          `  ${hlPlain('&lt;')}${hlTag('ComboboxContent')}${hlPlain('&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxInput')} ${hlAttr('placeholder')}${hlPlain('=')}${hlStr('&quot;Search framework...&quot;')} ${hlPlain('/&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxEmpty')}${hlPlain('&gt;')}${hlPlain('No framework found.')}${hlPlain('&lt;/')}${hlTag('ComboboxEmpty')}${hlPlain('&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;next&quot;')}${hlPlain('&gt;')}${hlPlain('Next.js')}${hlPlain('&lt;/')}${hlTag('ComboboxItem')}${hlPlain('&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;svelte&quot;')}${hlPlain('&gt;')}${hlPlain('SvelteKit')}${hlPlain('&lt;/')}${hlTag('ComboboxItem')}${hlPlain('&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;nuxt&quot;')}${hlPlain('&gt;')}${hlPlain('Nuxt')}${hlPlain('&lt;/')}${hlTag('ComboboxItem')}${hlPlain('&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;remix&quot;')}${hlPlain('&gt;')}${hlPlain('Remix')}${hlPlain('&lt;/')}${hlTag('ComboboxItem')}${hlPlain('&gt;')}`,
          `    ${hlPlain('&lt;')}${hlTag('ComboboxItem')} ${hlAttr('value')}${hlPlain('=')}${hlStr('&quot;astro&quot;')}${hlPlain('&gt;')}${hlPlain('Astro')}${hlPlain('&lt;/')}${hlTag('ComboboxItem')}${hlPlain('&gt;')}`,
          `  ${hlPlain('&lt;/')}${hlTag('ComboboxContent')}${hlPlain('&gt;')}`,
          `${hlPlain('&lt;/')}${hlTag('Combobox')}${hlPlain('&gt;')}`,
        ]
        codeEl.innerHTML = lines.join('\n')
      }
    })
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-combobox-preview"
      previewContent={
        <Combobox value={value()} onValueChange={setValue}>
          <ComboboxTrigger className="w-[280px]">
            <ComboboxValue placeholder="Select framework..." />
          </ComboboxTrigger>
          <ComboboxContent>
            <ComboboxInput placeholder="Search framework..." />
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxItem value="next">Next.js</ComboboxItem>
            <ComboboxItem value="svelte">SvelteKit</ComboboxItem>
            <ComboboxItem value="nuxt">Nuxt</ComboboxItem>
            <ComboboxItem value="remix">Remix</ComboboxItem>
            <ComboboxItem value="astro">Astro</ComboboxItem>
          </ComboboxContent>
        </Combobox>
      }
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
