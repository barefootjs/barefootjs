"use client"
/**
 * Resizable Props Playground
 *
 * Interactive playground for the Resizable components.
 * Allows tweaking withHandle prop with live preview.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { hlPlain, hlTag, hlAttr, hlStr } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Checkbox } from '@ui/components/ui/checkbox'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@ui/components/ui/resizable'

function ResizablePlayground(_props: {}) {
  const [withHandle, setWithHandle] = createSignal(false)

  const highlightCode = (): string => {
    const handleAttr = withHandle() ? ` ${hlAttr('withHandle')}` : ''
    return [
      `${hlPlain('&lt;')}${hlTag('ResizablePanelGroup')} ${hlAttr('direction')}${hlPlain('=')}${hlStr('&quot;horizontal&quot;')}${hlPlain('&gt;')}`,
      `  ${hlPlain('&lt;')}${hlTag('ResizablePanel')} ${hlAttr('defaultSize')}${hlPlain('={50}&gt;')}One${hlPlain('&lt;/')}${hlTag('ResizablePanel')}${hlPlain('&gt;')}`,
      `  ${hlPlain('&lt;')}${hlTag('ResizableHandle')}${handleAttr} ${hlPlain('/&gt;')}`,
      `  ${hlPlain('&lt;')}${hlTag('ResizablePanel')} ${hlAttr('defaultSize')}${hlPlain('={50}&gt;')}Two${hlPlain('&lt;/')}${hlTag('ResizablePanel')}${hlPlain('&gt;')}`,
      `${hlPlain('&lt;/')}${hlTag('ResizablePanelGroup')}${hlPlain('&gt;')}`,
    ].join('\n')
  }

  const plainCode = (): string => {
    const handleAttr = withHandle() ? ' withHandle' : ''
    return `<ResizablePanelGroup direction="horizontal">\n  <ResizablePanel defaultSize={50}>One</ResizablePanel>\n  <ResizableHandle${handleAttr} />\n  <ResizablePanel defaultSize={50}>Two</ResizablePanel>\n</ResizablePanelGroup>`
  }

  createEffect(() => {
    const code = highlightCode()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.innerHTML = code
  })

  // Toggle grip visibility via DOM (avoids compiler slot-template serialization bug)
  createEffect(() => {
    const gripEl = document.querySelector('[data-resizable-preview] [data-grip]') as HTMLElement
    if (gripEl) gripEl.setAttribute('data-grip', withHandle() ? 'show' : 'hide')
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-resizable-preview"
      previewContent={
        <>
          <style>{`[data-grip=hide] [data-slot=resizable-handle] div { display: none }`}</style>
          <div className="w-full max-w-md" data-grip="hide">
            <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
              <ResizablePanel defaultSize={50}>
                <div className="flex h-[200px] items-center justify-center p-6">
                  <span className="font-semibold">One</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50}>
                <div className="flex h-[200px] items-center justify-center p-6">
                  <span className="font-semibold">Two</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </>
      }
      controls={<>
        <PlaygroundControl label="withHandle">
          <Checkbox
            checked={withHandle()}
            onCheckedChange={setWithHandle}
          />
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={plainCode()} />}
    />
  )
}

export { ResizablePlayground }
