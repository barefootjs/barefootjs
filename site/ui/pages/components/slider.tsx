/**
 * Slider Reference Page (/components/slider)
 *
 * Focused developer reference with interactive Props Playground.
 * Part of the #515 page redesign initiative.
 */

import { Slider } from '@/components/ui/slider'
import { SliderPlayground } from '@/components/slider-playground'
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
import { Slider } from "@/components/ui/slider"

function SliderDemo() {
  const [volume, setVolume] = createSignal(50)

  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Default</span>
        <Slider />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">With initial value</span>
        <Slider defaultValue={50} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium leading-none">Controlled</span>
          <span className="text-sm text-muted-foreground tabular-nums">{volume()}%</span>
        </div>
        <Slider value={volume()} onValueChange={setVolume} />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Custom range (step=5)</span>
        <Slider min={0} max={100} step={5} defaultValue={50} />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium leading-none">Disabled</span>
        <Slider defaultValue={33} disabled />
      </div>
    </div>
  )
}`

const sliderProps: PropDefinition[] = [
  {
    name: 'defaultValue',
    type: 'number',
    defaultValue: '0',
    description: 'The initial value for uncontrolled mode.',
  },
  {
    name: 'value',
    type: 'number',
    description: 'The controlled value of the slider. When provided, the component is in controlled mode.',
  },
  {
    name: 'min',
    type: 'number',
    defaultValue: '0',
    description: 'The minimum value of the slider.',
  },
  {
    name: 'max',
    type: 'number',
    defaultValue: '100',
    description: 'The maximum value of the slider.',
  },
  {
    name: 'step',
    type: 'number',
    defaultValue: '1',
    description: 'The step increment for value changes.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Whether the slider is disabled.',
  },
  {
    name: 'onValueChange',
    type: '(value: number) => void',
    description: 'Event handler called when the slider value changes.',
  },
]

export function SliderRefPage() {
  return (
    <DocPage slug="slider" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Slider"
          description="An input where the user selects a value from within a given range."
          {...getNavLinks('slider')}
        />

        {/* Props Playground */}
        <SliderPlayground />

        {/* Installation */}
        <Section id="installation" title="Installation">
          <PackageManagerTabs command="barefoot add slider" />
        </Section>

        {/* Usage */}
        <Section id="usage" title="Usage">
          <Example title="" code={usageCode}>
            <div className="space-y-6 w-full max-w-sm">
              <div className="space-y-2">
                <span className="text-sm font-medium leading-none">Default</span>
                <Slider />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium leading-none">With initial value</span>
                <Slider defaultValue={50} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium leading-none">Custom range (step=5)</span>
                <Slider min={0} max={100} step={5} defaultValue={50} />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium leading-none">Disabled</span>
                <Slider defaultValue={33} disabled />
              </div>
            </div>
          </Example>
        </Section>

        {/* API Reference */}
        <Section id="api-reference" title="API Reference">
          <PropsTable props={sliderProps} />
        </Section>
      </div>
    </DocPage>
  )
}
