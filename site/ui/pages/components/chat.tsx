/**
 * Chat Reference Page (/components/chat)
 *
 * Block-level composition pattern: chat application with auto-scroll,
 * typing indicator, and reactive memo chains.
 * Compiler stress test for createEffect + DOM ref, effect cleanup,
 * and rapid list growth.
 */

import { ChatDemo } from '@/components/chat-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
]

const previewCode = `"use client"

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

type Message = { id: number; from: 'me' | 'them'; text: string; time: string }

function Chat() {
  const [messages, setMessages] = createSignal<Message[]>([])
  const [input, setInput] = createSignal('')
  let endRef: HTMLElement | undefined

  // Auto-scroll on new messages — the key compiler stress test
  createEffect(() => {
    messages()
    if (endRef) endRef.scrollIntoView({ behavior: 'smooth' })
  })

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1">
        {messages().map(msg => (
          <div key={msg.id} className={msg.from === 'me' ? 'text-right' : ''}>
            <span className="inline-block rounded-2xl px-4 py-2 bg-primary text-primary-foreground">
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={(el) => { endRef = el }} />
      </ScrollArea>
      <div className="flex gap-2 p-3">
        <Input value={input()} onInput={(e) => setInput(e.target.value)} />
        <Button onClick={() => { /* send */ }}>Send</Button>
      </div>
    </div>
  )
}`

export function ChatRefPage() {
  return (
    <DocPage slug="chat" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Chat"
          description="A messaging interface with contact list, auto-scrolling messages, typing indicator, and unread count badges."
          {...getNavLinks('chat')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <ChatDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Auto-Scroll with createEffect + DOM Ref</h3>
              <p className="text-sm text-muted-foreground">
                Messages auto-scroll to the bottom using createEffect that tracks the message list
                and calls scrollIntoView on a ref element. Tests createEffect + DOM ref interaction.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Typing Indicator with Effect Cleanup</h3>
              <p className="text-sm text-muted-foreground">
                Sending a message triggers a typing indicator that disappears after a simulated
                reply arrives. Uses setTimeout — tests timer-based effect patterns.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">3-Stage createMemo Chain</h3>
              <p className="text-sm text-muted-foreground">
                contactMessages (filter by active contact) → unreadCounts (per-contact unread) →
                totalUnread (sum). Tests multi-stage derived state computation.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Conditional Rendering in Loops</h3>
              <p className="text-sm text-muted-foreground">
                Messages render differently based on sender (me vs them) with distinct styling.
                Contact list shows conditional unread badges and last message previews.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
