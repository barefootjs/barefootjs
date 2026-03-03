"use client"
/**
 * Button Props Playground
 *
 * Interactive playground for the Button component.
 * Allows tweaking variant, size, and children props with live preview.
 *
 * Pure CSR approach: constructs Button DOM directly using the same
 * class strings as the Button source component. Code display uses
 * lightweight client-side JSX highlighting matching shiki's dual-theme
 * CSS variable pattern for light/dark mode support.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CheckIcon, CopyIcon } from '@ui/components/ui/icon'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { Input } from '@ui/components/ui/input'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

// Mirror of Button component class definitions (ui/components/ui/button/index.tsx)
const buttonBaseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive touch-action-manipulation'

const buttonVariantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
  outline: 'border bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
  link: 'text-foreground underline-offset-4 hover:underline hover:text-primary',
}

const buttonSizeClasses: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2 has-[>svg]:px-3',
  sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
  lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
  icon: 'size-9',
  'icon-sm': 'size-8',
  'icon-lg': 'size-10',
}

// Lightweight JSX syntax highlighter using shiki's dual-theme CSS variable pattern.
// Only handles the Button JSX pattern — not a general-purpose highlighter.
function highlightButtonJsx(v: string, s: string, text: string): string {
  const p = (str: string) => `<span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8">${str}</span>`
  const tag = (str: string) => `<span style="--shiki-light:#22863A;--shiki-dark:#85E89D">${str}</span>`
  const attr = (str: string) => `<span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0">${str}</span>`
  const str = (val: string) => `<span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF">${val}</span>`

  const t = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const props: string[] = []
  if (v !== 'default') props.push(`${attr('variant')}${p('=')}${str(`&quot;${v}&quot;`)}`)
  if (s !== 'default') props.push(`${attr('size')}${p('=')}${str(`&quot;${s}&quot;`)}`)

  const propsStr = props.length > 0 ? ` ${props.join(' ')}` : ''

  return `${p('&lt;')}${tag('Button')}${propsStr}${p('&gt;')}${t}${p('&lt;/')}${tag('Button')}${p('&gt;')}`
}

function ButtonPlayground(props: {}) {
  const [variant, setVariant] = createSignal<ButtonVariant>('default')
  const [size, setSize] = createSignal<ButtonSize>('default')
  const [text, setText] = createSignal('Button')
  const [copied, setCopied] = createSignal(false)

  const codeText = createMemo(() => {
    const v = variant()
    const s = size()
    const t = text()
    const parts: string[] = []
    if (v !== 'default') parts.push(`variant="${v}"`)
    if (s !== 'default') parts.push(`size="${s}"`)
    const propsStr = parts.length > 0 ? ` ${parts.join(' ')}` : ''
    return `<Button${propsStr}>${t}</Button>`
  })

  createEffect(() => {
    const v = variant()
    const s = size()
    const t = text()

    // Update button preview
    const container = document.querySelector('[data-button-preview]') as HTMLElement
    if (container) {
      const btn = document.createElement('button')
      btn.className = `${buttonBaseClasses} ${buttonVariantClasses[v]} ${buttonSizeClasses[s]}`
      btn.textContent = t
      container.innerHTML = ''
      container.appendChild(btn)
    }

    // Update highlighted code
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) {
      codeEl.innerHTML = highlightButtonJsx(v, s, t)
    }
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div id="preview" className="border border-border rounded-lg overflow-hidden scroll-mt-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px]">
        {/* Preview */}
        <div className="flex items-center justify-center min-h-[140px] p-8 bg-card relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted)/0.5)_1px,transparent_1px)] bg-[length:16px_16px] pointer-events-none" />
          <div className="relative z-10" data-button-preview />
        </div>

        {/* Controls */}
        <div className="border-t lg:border-t-0 lg:border-l border-border p-6 space-y-4 bg-background">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">variant</label>
            <Select value={variant()} onValueChange={(v: string) => setVariant(v as ButtonVariant)}>
              <SelectTrigger>
                <SelectValue placeholder="Select variant..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">default</SelectItem>
                <SelectItem value="destructive">destructive</SelectItem>
                <SelectItem value="outline">outline</SelectItem>
                <SelectItem value="secondary">secondary</SelectItem>
                <SelectItem value="ghost">ghost</SelectItem>
                <SelectItem value="link">link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">size</label>
            <Select value={size()} onValueChange={(v: string) => setSize(v as ButtonSize)}>
              <SelectTrigger>
                <SelectValue placeholder="Select size..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">default</SelectItem>
                <SelectItem value="sm">sm</SelectItem>
                <SelectItem value="lg">lg</SelectItem>
                <SelectItem value="icon">icon</SelectItem>
                <SelectItem value="icon-sm">icon-sm</SelectItem>
                <SelectItem value="icon-lg">icon-lg</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">children</label>
            <Input
              type="text"
              value="Button"
              onInput={(e: Event) => setText((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
      </div>

      {/* Generated code */}
      <div className="border-t border-border relative group">
        <pre className="m-0 p-4 pr-12 bg-muted overflow-x-auto text-sm font-mono">
          <code data-playground-code />
        </pre>
        <button
          type="button"
          className="absolute top-2 right-2 p-2 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Copy code"
          onClick={handleCopy}
        >
          {copied() ? <CheckIcon size="sm" /> : <CopyIcon size="sm" />}
        </button>
      </div>
    </div>
  )
}

export { ButtonPlayground }
