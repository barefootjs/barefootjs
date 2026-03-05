/**
 * Combobox Reference Page (/components/combobox)
 *
 * Focused developer reference with interactive Props Playground.
 * Part of the #515 page redesign initiative.
 */

import { ComboboxPlayground } from '@/components/combobox-playground'
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
import {
  Combobox, ComboboxTrigger, ComboboxValue, ComboboxContent,
  ComboboxInput, ComboboxEmpty, ComboboxItem,
} from '@ui/components/ui/combobox'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'installation', title: 'Installation' },
  { id: 'usage', title: 'Usage' },
  { id: 'api-reference', title: 'API Reference' },
]

const usageCode = `"use client"

import { createSignal } from '@barefootjs/dom'
import {
  Combobox, ComboboxTrigger, ComboboxValue, ComboboxContent,
  ComboboxInput, ComboboxEmpty, ComboboxItem,
} from '@/components/ui/combobox'

function ComboboxDemo() {
  const [value, setValue] = createSignal('')

  return (
    <Combobox value={value()} onValueChange={setValue}>
      <ComboboxTrigger class="w-[280px]">
        <ComboboxValue placeholder="Select framework..." />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="Search framework..." />
        <ComboboxEmpty>No framework found.</ComboboxEmpty>
        <ComboboxItem value="next">Next.js</ComboboxItem>
        <ComboboxItem value="svelte">SvelteKit</ComboboxItem>
        <ComboboxItem value="nuxt">Nuxt</ComboboxItem>
        <ComboboxItem value="remix">Remix</ComboboxItem>
        <ComboboxItem value="astro">Astro</ComboboxItem>
      </ComboboxContent>
    </Combobox>
  )
}`

const comboboxProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'Controlled selected value.',
  },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    description: 'Callback when the selected value changes.',
  },
  {
    name: 'filter',
    type: '(value: string, search: string) => boolean',
    description: 'Custom filter function. Defaults to case-insensitive substring match.',
  },
]

const comboboxItemProps: PropDefinition[] = [
  {
    name: 'value',
    type: 'string',
    description: 'The value for this option (required).',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether this option is disabled.',
  },
]

const comboboxInputProps: PropDefinition[] = [
  {
    name: 'placeholder',
    type: 'string',
    description: 'Placeholder text for the search input.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the search input is disabled.',
  },
]

export function ComboboxRefPage() {
  return (
    <DocPage slug="combobox" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Combobox"
          description="Autocomplete input with searchable dropdown."
          {...getNavLinks('combobox')}
        />

        {/* Props Playground */}
        <ComboboxPlayground />

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add combobox" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <Example title="" code={usageCode}>
            <Combobox>
              <ComboboxTrigger className="w-[280px]">
                <ComboboxValue placeholder="Select framework..." />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxInput placeholder="Search framework..." />
                <ComboboxEmpty>No framework found.</ComboboxEmpty>
                <ComboboxItem value="next">Next.js</ComboboxItem>
                <ComboboxItem value="svelte">SvelteKit</ComboboxItem>
                <ComboboxItem value="nuxt">Nuxt</ComboboxItem>
                <ComboboxItem value="remix">Remix</ComboboxItem>
                <ComboboxItem value="astro">Astro</ComboboxItem>
              </ComboboxContent>
            </Combobox>
          </Example>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <h3 className="text-base font-semibold mb-2">Combobox</h3>
          <PropsTable props={comboboxProps} />
          <h3 className="text-base font-semibold mt-6 mb-2">ComboboxItem</h3>
          <PropsTable props={comboboxItemProps} />
          <h3 className="text-base font-semibold mt-6 mb-2">ComboboxInput</h3>
          <PropsTable props={comboboxInputProps} />
        </Section>
      </div>
    </DocPage>
  )
}
