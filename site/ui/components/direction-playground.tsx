"use client"
/**
 * Direction Props Playground
 *
 * Interactive playground for the DirectionProvider component.
 * Allows toggling between LTR and RTL with live preview.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { highlightJsx, plainJsx, type HighlightProp } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { DirectionProvider } from '@ui/components/ui/direction'

type Dir = 'ltr' | 'rtl'

function DirectionPlayground(_props: {}) {
  const [dir, setDir] = createSignal<Dir>('ltr')

  const props = (): HighlightProp[] => [
    { name: 'dir', value: dir(), defaultValue: 'ltr' },
  ]

  createEffect(() => {
    const p = props()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.innerHTML = highlightJsx('DirectionProvider', p, 'Hello, World! مرحبا بالعالم')
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-direction-preview"
      previewContent={
        <DirectionProvider dir={dir()}>
          <div className="rounded-md border p-4">
            <p className="text-sm">Hello, World! مرحبا بالعالم</p>
          </div>
        </DirectionProvider>
      }
      controls={<>
        <PlaygroundControl label="dir">
          <Select value={dir()} onValueChange={(v: string) => setDir(v as Dir)}>
            <SelectTrigger>
              <SelectValue placeholder="Select direction..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ltr">ltr</SelectItem>
              <SelectItem value="rtl">rtl</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={plainJsx('DirectionProvider', props(), 'Hello, World! مرحبا بالعالم')} />}
    />
  )
}

export { DirectionPlayground }
