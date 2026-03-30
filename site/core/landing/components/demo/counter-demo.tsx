"use client"

/**
 * Interactive counter demo component
 *
 * Demonstrates reactive state with signals.
 */

import { createSignal } from '@barefootjs/dom'

export function CounterDemo() {
  const [count, setCount] = createSignal(0)

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <span className="text-lg font-mono text-foreground min-w-[3ch] text-center">
        {count()}
      </span>
      <button
        onClick={() => setCount(n => n + 1)}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Increment
      </button>
      <button
        onClick={() => setCount(0)}
        className="px-4 py-2 text-sm font-medium rounded-md border text-foreground hover:bg-accent transition-colors"
      >
        Reset
      </button>
    </div>
  )
}
