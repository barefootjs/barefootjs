"use client"
/**
 * SliderDemo Components
 *
 * Interactive demos for Slider component.
 * Based on shadcn/ui patterns for practical use cases.
 */

import { createSignal, createMemo } from '@barefootjs/dom'
import { Slider } from '@ui/components/ui/slider'

/**
 * Volume control example (Preview)
 * Controlled slider with live value display
 */
export function SliderPreviewDemo() {
  const [volume, setVolume] = createSignal(50)

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium leading-none">Volume</span>
        <span className="text-sm text-muted-foreground tabular-nums">{volume()}%</span>
      </div>
      <Slider value={volume()} onValueChange={setVolume} />
    </div>
  )
}

/**
 * Basic slider example
 * Shows simple usage with defaultValue and disabled states
 */
export function SliderBasicDemo() {
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
        <span className="text-sm font-medium leading-none">Disabled</span>
        <Slider defaultValue={33} disabled />
      </div>
    </div>
  )
}

/**
 * Display settings form with multiple controlled sliders
 * Shows controlled mode with reset functionality
 */
export function SliderFormDemo() {
  const [brightness, setBrightness] = createSignal(75)
  const [contrast, setContrast] = createSignal(100)
  const [saturation, setSaturation] = createSignal(100)

  const isDefault = createMemo(() =>
    brightness() === 75 && contrast() === 100 && saturation() === 100
  )

  const resetDefaults = () => {
    setBrightness(75)
    setContrast(100)
    setSaturation(100)
  }

  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Display Settings</h4>
        <p className="text-sm text-muted-foreground">
          Adjust brightness, contrast, and saturation.
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Brightness</span>
            <span className="text-sm text-muted-foreground tabular-nums">{brightness()}%</span>
          </div>
          <Slider value={brightness()} onValueChange={setBrightness} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Contrast</span>
            <span className="text-sm text-muted-foreground tabular-nums">{contrast()}%</span>
          </div>
          <Slider value={contrast()} max={200} onValueChange={setContrast} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Saturation</span>
            <span className="text-sm text-muted-foreground tabular-nums">{saturation()}%</span>
          </div>
          <Slider value={saturation()} max={200} onValueChange={setSaturation} />
        </div>
      </div>
      <button
        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        disabled={isDefault()}
        onClick={resetDefaults}
      >
        Reset to defaults
      </button>
    </div>
  )
}

/**
 * Custom range demo
 * Shows min/max/step customization with different configurations
 */
export function SliderStepDemo() {
  const [fontSize, setFontSize] = createSignal(16)
  const [opacity, setOpacity] = createSignal(100)

  return (
    <div className="space-y-6 w-full max-w-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Font Size</span>
          <span className="text-sm text-muted-foreground tabular-nums">{fontSize()}px</span>
        </div>
        <Slider
          value={fontSize()}
          min={8}
          max={32}
          step={1}
          onValueChange={setFontSize}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>8px</span>
          <span>32px</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Opacity</span>
          <span className="text-sm text-muted-foreground tabular-nums">{opacity()}%</span>
        </div>
        <Slider
          value={opacity()}
          min={0}
          max={100}
          step={5}
          onValueChange={setOpacity}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
      <div
        className="rounded-md border p-4 text-center text-sm"
        style={`font-size: ${fontSize()}px; opacity: ${opacity() / 100}`}
      >
        Preview text
      </div>
    </div>
  )
}
