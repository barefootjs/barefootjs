"use client"

/**
 * Interactive Code Demo
 *
 * Shows Counter JSX source and compiled output for different backends.
 */

import { createSignal, onMount } from '@barefootjs/dom'
import { COUNTER_SOURCE, HONO_OUTPUT, ECHO_OUTPUT } from './code-examples'

export function CodeDemo() {
  const tabs = [
    { id: 'hono', label: 'Hono', output: HONO_OUTPUT },
    { id: 'echo', label: 'Echo', output: ECHO_OUTPUT },
  ]

  const [activeTab, setActiveTab] = createSignal('hono')
  const [displayedCode, setDisplayedCode] = createSignal('')
  const [isTyping, setIsTyping] = createSignal(false)

  const typeCode = (code: string) => {
    setIsTyping(true)
    setDisplayedCode('')
    let i = 0
    const interval = setInterval(() => {
      if (i < code.length) {
        setDisplayedCode(code.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, 15)
    return () => clearInterval(interval)
  }

  onMount(() => {
    const currentTab = tabs.find(t => t.id === activeTab())
    if (currentTab) {
      typeCode(currentTab.output)
    }
  })

  const handleTabClick = (tabId: string) => {
    if (tabId === activeTab()) return
    setActiveTab(tabId)
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      typeCode(tab.output)
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Source Code */}
      <div className="code-block">
        <div className="code-header">Counter.tsx</div>
        <div className="code-content">{COUNTER_SOURCE}</div>
      </div>

      {/* Output */}
      <div className="code-block">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab() === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="code-content min-h-[280px]">
          {displayedCode()}
          {isTyping() && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  )
}
