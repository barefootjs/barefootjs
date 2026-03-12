"use client"
/**
 * Tabs Props Playground
 *
 * Interactive playground for the Tabs component.
 * Allows tweaking the default selected tab with live preview.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { CopyButton } from './copy-button'
import { highlightJsxTree, plainJsxTree, type JsxTreeNode, type HighlightProp } from './shared/playground-highlight'
import { PlaygroundLayout, PlaygroundControl } from './shared/PlaygroundLayout'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@ui/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@ui/components/ui/tabs'

type TabValue = 'account' | 'password'

function TabsPlayground(_props: {}) {
  const [defaultValue, setDefaultValue] = createSignal<TabValue>('account')
  const [activeTab, setActiveTab] = createSignal<TabValue>('account')

  const isAccountSelected = createMemo(() => activeTab() === 'account')
  const isPasswordSelected = createMemo(() => activeTab() === 'password')

  // Sync activeTab when defaultValue changes
  createEffect(() => {
    setActiveTab(defaultValue())
  })

  const treeNode = (): JsxTreeNode => ({
    tag: 'Tabs',
    props: [{ name: 'value', value: defaultValue(), defaultValue: 'account' }] as HighlightProp[],
    children: [
      {
        tag: 'TabsList',
        children: [
          { tag: 'TabsTrigger', props: [{ name: 'value', value: 'account', defaultValue: '' }] as HighlightProp[], children: 'Account' },
          { tag: 'TabsTrigger', props: [{ name: 'value', value: 'password', defaultValue: '' }] as HighlightProp[], children: 'Password' },
        ],
      },
      { tag: 'TabsContent', props: [{ name: 'value', value: 'account', defaultValue: '' }] as HighlightProp[], children: '...' },
      { tag: 'TabsContent', props: [{ name: 'value', value: 'password', defaultValue: '' }] as HighlightProp[], children: '...' },
    ],
  })

  createEffect(() => {
    const node = treeNode()
    const codeEl = document.querySelector('[data-playground-code]') as HTMLElement
    if (codeEl) codeEl.innerHTML = highlightJsxTree(node)
  })

  return (
    <PlaygroundLayout
      previewDataAttr="data-tabs-preview"
      previewContent={
        <div className="w-full max-w-sm">
          <Tabs value={activeTab()}>
            <TabsList>
              <TabsTrigger
                value="account"
                selected={isAccountSelected()}
                disabled={false}
                onClick={() => setActiveTab('account')}
              >
                Account
              </TabsTrigger>
              <TabsTrigger
                value="password"
                selected={isPasswordSelected()}
                disabled={false}
                onClick={() => setActiveTab('password')}
              >
                Password
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account" selected={isAccountSelected()}>
              <div className="p-4 rounded-lg border border-border bg-background">
                <p className="text-muted-foreground text-sm">Account settings content.</p>
              </div>
            </TabsContent>
            <TabsContent value="password" selected={isPasswordSelected()}>
              <div className="p-4 rounded-lg border border-border bg-background">
                <p className="text-muted-foreground text-sm">Password settings content.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
      controls={<>
        <PlaygroundControl label="defaultValue">
          <Select value={defaultValue()} onValueChange={(v: string) => setDefaultValue(v as TabValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Select tab..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="account">account</SelectItem>
              <SelectItem value="password">password</SelectItem>
            </SelectContent>
          </Select>
        </PlaygroundControl>
      </>}
      copyButton={<CopyButton code={plainJsxTree(treeNode())} />}
    />
  )
}

export { TabsPlayground }
