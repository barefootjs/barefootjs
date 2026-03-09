"use client"
/**
 * RadioGroup Usage Demo
 *
 * "use client" wrapper for RadioGroup usage examples in the ref page.
 * Context-based compound components must be rendered as client components.
 */

import { createSignal } from '@barefootjs/dom'
import { RadioGroup, RadioGroupItem } from '@ui/components/ui/radio-group'

export function RadioGroupUsageDemo() {
  const [plan, setPlan] = createSignal('free')

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
}
