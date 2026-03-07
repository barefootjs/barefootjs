/**
 * RadioGroup Reference Page (/components/radio-group)
 *
 * Focused developer reference with interactive Props Playground.
 * Part of the #515 page redesign initiative.
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { RadioGroupPlayground } from '@/components/radio-group-playground'
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

function RadioGroupDemo() {
  const [value, setValue] = createSignal("default")

  return (
    <div className="space-y-4">
      <RadioGroup defaultValue="default" onValueChange={setValue}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="default" />
          <span className="text-sm font-medium leading-none">Default</span>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="comfortable" />
          <span className="text-sm font-medium leading-none">Comfortable</span>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="compact" />
          <span className="text-sm font-medium leading-none">Compact</span>
        </div>
      </RadioGroup>
      <div className="flex items-center space-x-2 opacity-50">
        <RadioGroup disabled>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="disabled" />
            <span className="text-sm font-medium leading-none">Disabled</span>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}`

const radioGroupProps: PropDefinition[] = [
  {
    name: 'defaultValue',
    type: 'string',
    description: 'The initial selected value for uncontrolled mode.',
  },
  {
    name: 'value',
    type: 'string',
    description: 'The controlled selected value. When provided, the component is in controlled mode.',
  },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    description: 'Event handler called when the selected value changes.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the entire radio group is disabled.',
  },
]

const radioGroupItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The value of this radio item. Required.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether this radio item is disabled.',
  },
]

export function RadioGroupRefPage() {
  return (
    <DocPage slug="radio-group" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Radio Group"
          description="A set of checkable buttons where only one can be checked at a time."
          {...getNavLinks('radio-group')}
        />

        {/* Props Playground */}
        <RadioGroupPlayground />

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add radio-group" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <Example title="" code={usageCode}>
            <div className="space-y-4">
              <RadioGroup defaultValue="default">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" />
                  <span className="text-sm font-medium leading-none">Default</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comfortable" />
                  <span className="text-sm font-medium leading-none">Comfortable</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" />
                  <span className="text-sm font-medium leading-none">Compact</span>
                </div>
              </RadioGroup>
              <div className="opacity-50">
                <RadioGroup disabled>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="disabled" />
                    <span className="text-sm font-medium leading-none">Disabled</span>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </Example>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <h3 className="text-lg font-semibold mb-4">RadioGroup</h3>
          <PropsTable props={radioGroupProps} />
          <h3 className="text-lg font-semibold mb-4 mt-8">RadioGroupItem</h3>
          <PropsTable props={radioGroupItemProps} />
        </Section>
      </div>
    </DocPage>
  )
}
