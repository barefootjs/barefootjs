"use client"
/**
 * ToggleGroupDemo Components
 *
 * Interactive demos for ToggleGroup component.
 * Each demo shows a visual preview that responds to selection changes.
 */

import { createSignal } from '@barefootjs/dom'
import { ToggleGroup, ToggleGroupItem } from '@ui/components/ui/toggle-group'

/**
 * Basic single-select example: text alignment picker with live preview
 */
export function ToggleGroupBasicDemo() {
  const [alignment, setAlignment] = createSignal('center')

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" defaultValue="center" onValueChange={(v: string | string[]) => setAlignment(v as string)}>
        <ToggleGroupItem value="left" aria-label="Align left">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M3 12h10M3 18h14" />
          </svg>
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M7 12h10M5 18h14" />
          </svg>
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M11 12h10M7 18h14" />
          </svg>
        </ToggleGroupItem>
      </ToggleGroup>
      <div data-testid="alignment-preview" className={`${alignment() === 'left' ? 'text-left' : alignment() === 'right' ? 'text-right' : 'text-center'} rounded-md border p-4 text-sm`}>
        <p>The quick brown fox jumps over the lazy dog. This sentence demonstrates how text alignment affects the readability and visual flow of your content.</p>
      </div>
    </div>
  )
}

/**
 * Outline variant example: font size selector with live preview
 */
export function ToggleGroupOutlineDemo() {
  const [fontSize, setFontSize] = createSignal('M')

  return (
    <div className="space-y-4">
      <ToggleGroup type="single" variant="outline" defaultValue="M" onValueChange={(v: string | string[]) => setFontSize(v as string)}>
        <ToggleGroupItem value="S" aria-label="Small font">
          S
        </ToggleGroupItem>
        <ToggleGroupItem value="M" aria-label="Medium font">
          M
        </ToggleGroupItem>
        <ToggleGroupItem value="L" aria-label="Large font">
          L
        </ToggleGroupItem>
      </ToggleGroup>
      <div data-testid="fontsize-preview" className={`${fontSize() === 'S' ? 'text-sm' : fontSize() === 'L' ? 'text-lg' : 'text-base'} rounded-md border p-4`}>
        <p>The quick brown fox jumps over the lazy dog.</p>
      </div>
    </div>
  )
}

/**
 * Multiple selection example: text formatting toolbar with live preview
 */
export function ToggleGroupMultipleDemo() {
  const [formats, setFormats] = createSignal<string[]>([])

  return (
    <div className="space-y-4">
      <ToggleGroup type="multiple" onValueChange={(v: string | string[]) => setFormats(v as string[])}>
        <ToggleGroupItem value="Bold" aria-label="Toggle bold">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </ToggleGroupItem>
        <ToggleGroupItem value="Italic" aria-label="Toggle italic">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 4h-9M14 20H5M15 4L9 20" />
          </svg>
        </ToggleGroupItem>
        <ToggleGroupItem value="Underline" aria-label="Toggle underline">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 21h16" />
          </svg>
        </ToggleGroupItem>
      </ToggleGroup>
      <div data-testid="format-preview" className={`${formats().includes('Bold') ? 'font-bold' : ''} ${formats().includes('Italic') ? 'italic' : ''} ${formats().includes('Underline') ? 'underline' : ''} rounded-md border p-4 text-sm`}>
        <p>The quick brown fox jumps over the lazy dog. Toggle the formatting options above to see the effect on this text.</p>
      </div>
    </div>
  )
}
