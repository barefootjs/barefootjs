/**
 * Select Reference Page (/components/select)
 *
 * Focused developer reference with interactive Props Playground.
 * Part of the #515 page redesign initiative.
 */

import { SelectPlayground } from '@/components/select-playground'
import { SelectGroupedDemo } from '@/components/select-demo'
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
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem, SelectGroup,
  SelectLabel, SelectSeparator,
} from "@/components/ui/select"

function SelectDemo() {
  const [timezone, setTimezone] = createSignal("")

  return (
    <Select value={timezone()} onValueChange={setTimezone}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select timezone..." />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North America</SelectLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}`

const selectProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The controlled value of the select.',
  },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    description: 'Callback when the selected value changes.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the select is disabled.',
  },
  {
    name: 'open',
    type: 'boolean',
    description: 'Controlled open state of the dropdown.',
  },
  {
    name: 'onOpenChange',
    type: '(open: boolean) => void',
    description: 'Callback when the open state changes.',
  },
]

const selectItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The value for this item (required).',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether this item is disabled.',
  },
  {
    name: 'children',
    type: 'Child',
    description: 'The display label for this item.',
  },
]

export function SelectRefPage() {
  return (
    <DocPage slug="select" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Select"
          description="Displays a list of options for the user to pick from, triggered by a button."
          {...getNavLinks('select')}
        />

        {/* Props Playground */}
        <SelectPlayground />

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add select" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <Example title="" code={usageCode}>
            <SelectGroupedDemo />
          </Example>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <h3 className="text-lg font-semibold mb-4">Select</h3>
          <PropsTable props={selectProps} />
          <h3 className="text-lg font-semibold mb-4 mt-8">SelectItem</h3>
          <PropsTable props={selectItemProps} />
        </Section>
      </div>
    </DocPage>
  )
}
