"use client"
/**
 * Empty Props Playground
 *
 * Interactive playground for the Empty component.
 * Allows tweaking EmptyMedia variant prop with live preview.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { highlightJsxTree, plainJsxTree, type JsxTreeNode, type HighlightProp } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@ui/components/ui/empty'
import { Button } from '@ui/components/ui/button'

type EmptyMediaVariant = 'default' | 'icon'

// Lucide Package icon (inline SVG)
function PackageIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.5 9.4 7.55 4.24" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="3.29 7 12 12 20.71 7" />
      <line stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="12" x2="12" y1="22" y2="12" />
    </svg>
  )
}

function EmptyPlayground(_props: {}) {
  const [variant, setVariant] = createSignal<EmptyMediaVariant>('icon')

  const variantProp = (): HighlightProp => ({
    name: 'variant',
    value: variant(),
    defaultValue: 'default',
  })

  const tree = (): JsxTreeNode => ({
    tag: 'Empty',
    props: [],
    children: [
      {
        tag: 'EmptyHeader',
        children: [
          { tag: 'EmptyMedia', props: [variantProp()], children: '<PackageIcon />' },
          { tag: 'EmptyTitle', children: 'No items yet' },
          { tag: 'EmptyDescription', children: 'Get started by adding your first item.' },
        ],
      },
      {
        tag: 'EmptyContent',
        children: [
          { tag: 'Button', children: 'Add item' },
        ],
      },
    ],
  })

  createEffect(() => {
    const t = tree()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.innerHTML = highlightJsxTree(t)
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-empty-preview"
      previewContent={
        <div className="w-full max-w-md">
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyMedia variant={variant()}>
                <PackageIcon />
              </EmptyMedia>
              <EmptyTitle>No items yet</EmptyTitle>
              <EmptyDescription>
                Get started by adding your first item.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button>Add item</Button>
            </EmptyContent>
          </Empty>
        </div>
      }
      controls={<>
        <PlaygroundControl label="media variant">
          <Select value={variant()} onValueChange={(v: string) => setVariant(v as EmptyMediaVariant)}>
            <SelectTrigger>
              <SelectValue placeholder="Select variant..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">default</SelectItem>
              <SelectItem value="icon">icon</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={plainJsxTree(tree())} />}
    />
  )
}

export { EmptyPlayground }
