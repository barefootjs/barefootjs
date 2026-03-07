/**
 * ToggleGroup Reference Page (/components/toggle-group)
 *
 * Focused developer reference with interactive Props Playground.
 * Part of the #515 page redesign initiative.
 */

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ToggleGroupPlayground } from '@/components/toggle-group-playground'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  PropsTable,
  PackageManagerTabs,
  type PropDefinition,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'api-reference', title: 'API Reference' },
]

const usageCode = `"use client"

import { createSignal } from "@barefootjs/dom"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

function ToggleGroupDemo() {
  const [alignment, setAlignment] = createSignal("center")
  const [formats, setFormats] = createSignal<string[]>([])

  return (
    <div className="space-y-6">
      {/* Single selection */}
      <ToggleGroup type="single" defaultValue="center" onValueChange={setAlignment}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>

      {/* Outline variant */}
      <ToggleGroup type="single" variant="outline" defaultValue="M">
        <ToggleGroupItem value="S">S</ToggleGroupItem>
        <ToggleGroupItem value="M">M</ToggleGroupItem>
        <ToggleGroupItem value="L">L</ToggleGroupItem>
      </ToggleGroup>

      {/* Multiple selection */}
      <ToggleGroup type="multiple" onValueChange={setFormats}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>

      {/* Disabled */}
      <ToggleGroup type="single" disabled>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
        <ToggleGroupItem value="b">B</ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}`

const toggleGroupProps: PropDefinition[] = [
  {
    name: 'type',
    type: "'single' | 'multiple'",
    description: 'The selection mode. "single" allows one item, "multiple" allows many.',
  },
  {
    name: 'defaultValue',
    type: 'string | string[]',
    description: 'The default selected value(s) for uncontrolled mode.',
  },
  {
    name: 'value',
    type: 'string | string[]',
    description: 'The controlled selected value(s). When provided, the component is in controlled mode.',
  },
  {
    name: 'onValueChange',
    type: '(value: string | string[]) => void',
    description: 'Event handler called when the selection changes.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the entire group is disabled.',
  },
  {
    name: 'variant',
    type: "'default' | 'outline'",
    defaultValue: "'default'",
    description: 'The visual variant applied to all items.',
  },
  {
    name: 'size',
    type: "'default' | 'sm' | 'lg'",
    defaultValue: "'default'",
    description: 'The size applied to all items.',
  },
]

const toggleGroupItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The value for this toggle item.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether this item is disabled.',
  },
]

export function ToggleGroupRefPage() {
  return (
    <DocPage slug="toggle-group" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Toggle Group"
          description="A set of two-state buttons that can be toggled on or off."
          {...getNavLinks('toggle-group')}
        />

        {/* Props Playground */}
        <ToggleGroupPlayground />

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add toggle-group" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <Example title="" code={usageCode}>
            <div className="space-y-6">
              <ToggleGroup type="single" defaultValue="center">
                <ToggleGroupItem value="left">Left</ToggleGroupItem>
                <ToggleGroupItem value="center">Center</ToggleGroupItem>
                <ToggleGroupItem value="right">Right</ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup type="single" variant="outline" defaultValue="M">
                <ToggleGroupItem value="S">S</ToggleGroupItem>
                <ToggleGroupItem value="M">M</ToggleGroupItem>
                <ToggleGroupItem value="L">L</ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup type="multiple">
                <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
                <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
                <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
              </ToggleGroup>
              <ToggleGroup type="single" disabled>
                <ToggleGroupItem value="a">A</ToggleGroupItem>
                <ToggleGroupItem value="b">B</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </Example>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">ToggleGroup</h3>
              <PropsTable props={toggleGroupProps} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">ToggleGroupItem</h3>
              <PropsTable props={toggleGroupItemProps} />
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
