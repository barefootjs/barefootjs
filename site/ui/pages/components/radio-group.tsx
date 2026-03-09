/**
 * RadioGroup Reference Page (/components/radio-group)
 *
 * Focused developer reference with interactive Props Playground.
 * Part of the #515 page redesign initiative.
 */

import { RadioGroupPlayground } from '@/components/radio-group-playground'
import { RadioGroupUsageDemo } from '@/components/radio-group-usage-demo'
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
  const [plan, setPlan] = createSignal("free")

  return (
    <div className="space-y-6">
      {/* Uncontrolled with defaultValue */}
      <RadioGroup defaultValue="email">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="email" />
          <span className="text-sm font-medium leading-none">Email</span>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sms" />
          <span className="text-sm font-medium leading-none">SMS</span>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="push" />
          <span className="text-sm font-medium leading-none">Push notification</span>
        </div>
      </RadioGroup>

      {/* Controlled with onValueChange */}
      <RadioGroup value={plan()} onValueChange={setPlan}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="free" />
          <span className="text-sm font-medium leading-none">Free</span>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pro" />
          <span className="text-sm font-medium leading-none">Pro</span>
        </div>
      </RadioGroup>

      {/* Disabled */}
      <RadioGroup disabled defaultValue="on">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="on" />
          <span className="text-sm font-medium leading-none">On</span>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="off" />
          <span className="text-sm font-medium leading-none">Off</span>
        </div>
      </RadioGroup>
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
            <RadioGroupUsageDemo />
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
