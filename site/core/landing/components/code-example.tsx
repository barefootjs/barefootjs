/**
 * Code example section component
 *
 * Displays a syntax-highlighted code example with live demo.
 */

import { highlight } from './shared/highlighter'
import { CounterDemo } from '@/components/demo/counter-demo'

const counterCode = `"use client"

import { createSignal } from '@barefootjs/dom'

export function Counter() {
  const [count, setCount] = createSignal(0)

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(n => n + 1)}>
        Increment
      </button>
    </div>
  )
}`

export function CodeExample() {
  const highlightedCode = highlight(counterCode, 'tsx')

  return (
    <section className="py-16">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-center mb-8">
        Simple by Design
      </h2>
      <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
        Write reactive components with familiar JSX syntax. No virtual DOM, no complexity.
      </p>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Live Demo */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Try it:</p>
          <CounterDemo />
        </div>
        {/* Code */}
        <div className="rounded-lg border overflow-hidden bg-card">
          <div className="px-4 py-2 border-b bg-muted">
            <span className="text-sm text-muted-foreground font-mono">counter.tsx</span>
          </div>
          <pre className="p-4 overflow-x-auto text-sm">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        </div>
      </div>
    </section>
  )
}
