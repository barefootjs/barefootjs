"use client"
/**
 * NativeSelect Props Playground
 *
 * Interactive playground for the NativeSelect component.
 * Allows tweaking size and disabled props with live preview.
 */

import { createSignal, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { highlightJsxTree, plainJsxTree, type HighlightProp, type JsxTreeNode } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import { NativeSelect, NativeSelectOption } from '@ui/components/ui/native-select'
import { Checkbox } from '@ui/components/ui/checkbox'

type SizeOption = 'default' | 'sm'

function NativeSelectPlayground(_props: {}) {
  const [size, setSize] = createSignal<SizeOption>('default')
  const [disabled, setDisabled] = createSignal(false)

  const treeNode = (): JsxTreeNode => ({
    tag: 'NativeSelect',
    props: [
      { name: 'size', value: size(), defaultValue: 'default' },
      { name: 'disabled', value: String(disabled()), defaultValue: 'false', kind: 'boolean' },
    ] as HighlightProp[],
    children: [
      { tag: 'NativeSelectOption', props: [{ name: 'value', value: 'apple', defaultValue: '' }], children: 'Apple' },
      { tag: 'NativeSelectOption', props: [{ name: 'value', value: 'banana', defaultValue: '' }], children: 'Banana' },
      { tag: 'NativeSelectOption', props: [{ name: 'value', value: 'cherry', defaultValue: '' }], children: 'Cherry' },
    ],
  })

  createEffect(() => {
    const node = treeNode()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.innerHTML = highlightJsxTree(node)
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-native-select-preview"
      previewContent={
        <NativeSelect
          size={size()}
          disabled={disabled()}
        >
          <NativeSelectOption value="apple">Apple</NativeSelectOption>
          <NativeSelectOption value="banana">Banana</NativeSelectOption>
          <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
        </NativeSelect>
      }
      controls={<>
        <PlaygroundControl label="size">
          <Select value={size()} onValueChange={(v: string) => setSize(v as SizeOption)}>
            <SelectTrigger>
              <SelectValue placeholder="Select size..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">default</SelectItem>
              <SelectItem value="sm">sm</SelectItem>
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
      copyButton={<CopyButton code={plainJsxTree(treeNode())} />}
    />
  )
}

export { NativeSelectPlayground }
