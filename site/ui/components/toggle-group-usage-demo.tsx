"use client"
/**
 * ToggleGroup Usage Demo
 *
 * "use client" wrapper for ToggleGroup usage examples in the ref page.
 * Context-based compound components must be rendered as client components.
 */

import { ToggleGroup, ToggleGroupItem } from '@ui/components/ui/toggle-group'

export function ToggleGroupUsageDemo() {
  return (
    <div className="space-y-6">
      {/* Single selection */}
      <ToggleGroup type="single" defaultValue="center">
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
      <ToggleGroup type="multiple">
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
}
