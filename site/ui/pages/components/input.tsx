/**
 * Input Reference Page (/components/input)
 *
 * Focused developer reference with interactive Props Playground.
 * Part of the #515 page redesign initiative.
 */

import { Input } from '@/components/ui/input'
import { InputPlayground } from '@/components/input-playground'
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

const usageCode = `import { Input } from "@/components/ui/input"

function InputDemo() {
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input disabled placeholder="Disabled input" />
    </div>
  )
}`

const inputProps: PropDefinition[] = [
  {
    name: 'type',
    type: "'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'",
    defaultValue: "'text'",
    description: 'The type of the input.',
  },
  {
    name: 'placeholder',
    type: 'string',
    description: 'Placeholder text shown when input is empty.',
  },
  {
    name: 'value',
    type: 'string',
    description: 'The controlled value of the input.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the input is disabled.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional CSS class names.',
  },
  {
    name: 'onInput',
    type: '(e: InputEvent) => void',
    description: 'Event handler called on each input change.',
  },
  {
    name: 'onChange',
    type: '(e: Event) => void',
    description: 'Event handler called when input value changes and loses focus.',
  },
  {
    name: 'onBlur',
    type: '(e: FocusEvent) => void',
    description: 'Event handler called when input loses focus.',
  },
  {
    name: 'onFocus',
    type: '(e: FocusEvent) => void',
    description: 'Event handler called when input gains focus.',
  },
]

export function InputRefPage() {
  return (
    <DocPage slug="input" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Input"
          description="Displays an input field for user text entry."
          {...getNavLinks('input')}
        />

        {/* Props Playground */}
        <InputPlayground />

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add input" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <Example title="" code={usageCode}>
            <div className="flex flex-col gap-4 max-w-sm">
              <Input type="text" placeholder="Text input" />
              <Input type="email" placeholder="Email address" />
              <Input type="password" placeholder="Password" />
              <Input type="number" placeholder="Number" />
              <Input disabled placeholder="Disabled input" />
            </div>
          </Example>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={inputProps} />
        </Section>
      </div>
    </DocPage>
  )
}
