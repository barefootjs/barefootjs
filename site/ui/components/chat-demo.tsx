"use client"
/**
 * ChatDemo Component
 *
 * Chat application block with contact list, message area, and typing indicator.
 * Compiler stress: createEffect + DOM ref (auto-scroll), effect cleanup (typing
 * indicator timeout), conditional rendering in loops (sent vs received),
 * createMemo chains (unread count, filtered contacts), rapid list growth.
 */

import { createSignal, createMemo, createEffect } from '@barefootjs/dom'
import { Avatar, AvatarFallback } from '@ui/components/ui/avatar'
import { Badge } from '@ui/components/ui/badge'
import { Button } from '@ui/components/ui/button'
import { Input } from '@ui/components/ui/input'
import { ScrollArea } from '@ui/components/ui/scroll-area'
import { Separator } from '@ui/components/ui/separator'
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@ui/components/ui/toast'

type Message = {
  id: number
  contactId: string
  from: 'me' | 'them'
  text: string
  time: string
}

type Contact = {
  id: string
  name: string
  initials: string
  status: 'online' | 'offline' | 'away'
}

const contacts: Contact[] = [
  { id: 'alice', name: 'Alice Chen', initials: 'AC', status: 'online' },
  { id: 'bob', name: 'Bob Park', initials: 'BP', status: 'away' },
  { id: 'carol', name: 'Carol Liu', initials: 'CL', status: 'online' },
  { id: 'dave', name: 'Dave Kim', initials: 'DK', status: 'offline' },
]

const initialMessages: Message[] = [
  { id: 1, contactId: 'alice', from: 'them', text: 'Hey! How is the project going?', time: '10:00' },
  { id: 2, contactId: 'alice', from: 'me', text: 'Pretty good! Just finished the compiler refactor.', time: '10:02' },
  { id: 3, contactId: 'alice', from: 'them', text: 'Nice! Any bugs found?', time: '10:03' },
  { id: 4, contactId: 'bob', from: 'them', text: 'Can you review my PR?', time: '09:30' },
  { id: 5, contactId: 'bob', from: 'me', text: 'Sure, I will take a look this afternoon.', time: '09:45' },
  { id: 6, contactId: 'carol', from: 'them', text: 'Meeting at 3pm today', time: '08:15' },
  { id: 7, contactId: 'carol', from: 'me', text: 'Got it, thanks!', time: '08:20' },
  { id: 8, contactId: 'carol', from: 'them', text: 'Also, can you share the design doc?', time: '08:25' },
  { id: 9, contactId: 'dave', from: 'them', text: 'Welcome to the team!', time: 'Yesterday' },
]

// Auto-reply messages for simulating conversation
const autoReplies = [
  'Got it, thanks!',
  'Sounds good to me.',
  'Let me think about that...',
  'Interesting, tell me more.',
  'I will check and get back to you.',
  'That makes sense!',
  'Great work!',
]

const statusColor: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  offline: 'bg-muted-foreground/40',
}

/**
 * Chat application — createEffect + DOM ref stress test
 *
 * Compiler stress points:
 * - createEffect with DOM ref: auto-scroll message area on new messages
 * - Effect cleanup: typing indicator timeout (setTimeout + clearTimeout)
 * - Conditional in loop: sent vs received message styling
 * - createMemo chains: 3 stages — contactMessages → unreadCounts → totalUnread
 * - Rapid list mutation: sending messages + receiving auto-replies
 * - Module-level constant lookup in loop: statusColor[contact.status]
 */
export function ChatDemo() {
  const [messages, setMessages] = createSignal<Message[]>(initialMessages)
  const [activeContact, setActiveContact] = createSignal('alice')
  const [inputText, setInputText] = createSignal('')
  const [searchQuery, setSearchQuery] = createSignal('')
  const [isTyping, setIsTyping] = createSignal(false)
  const [nextId, setNextId] = createSignal(10)
  const [readUpTo, setReadUpTo] = createSignal<Record<string, number>>({
    alice: 3,
    bob: 5,
    carol: 7,
    dave: 9,
  })
  const [toastOpen, setToastOpen] = createSignal(false)
  const [toastMessage, setToastMessage] = createSignal('')

  // Memo chain stage 1: messages for active contact
  const contactMessages = createMemo(() =>
    messages().filter(m => m.contactId === activeContact())
  )

  // Memo chain stage 2: unread count per contact
  const unreadCounts = createMemo(() => {
    const counts: Record<string, number> = {}
    const read = readUpTo()
    for (const contact of contacts) {
      counts[contact.id] = messages().filter(
        m => m.contactId === contact.id && m.from === 'them' && m.id > (read[contact.id] || 0)
      ).length
    }
    return counts
  })

  // Memo chain stage 3: total unread across all contacts
  const totalUnread = createMemo(() =>
    Object.values(unreadCounts()).reduce((sum, n) => sum + n, 0)
  )

  // Memo: filtered contacts by search
  const filteredContacts = createMemo(() => {
    const q = searchQuery().toLowerCase()
    if (!q) return contacts
    return contacts.filter(c => c.name.toLowerCase().includes(q))
  })

  // Memo: last message per contact (for preview)
  const lastMessages = createMemo(() => {
    const last: Record<string, Message> = {}
    for (const m of messages()) {
      last[m.contactId] = m
    }
    return last
  })

  let messagesEndRef: HTMLElement | undefined

  // createEffect + DOM ref: auto-scroll to bottom when messages change
  createEffect(() => {
    // Track contactMessages to trigger on message or contact change
    contactMessages()
    if (messagesEndRef) {
      messagesEndRef.scrollIntoView({ behavior: 'smooth' })
    }
  })

  const showToast = (message: string) => {
    setToastMessage(message)
    setToastOpen(true)
    setTimeout(() => setToastOpen(false), 3000)
  }

  const markAsRead = (contactId: string) => {
    const contactMsgs = messages().filter(m => m.contactId === contactId && m.from === 'them')
    if (contactMsgs.length > 0) {
      const maxId = Math.max(...contactMsgs.map(m => m.id))
      setReadUpTo(prev => ({ ...prev, [contactId]: maxId }))
    }
  }

  const switchContact = (contactId: string) => {
    setActiveContact(contactId)
    markAsRead(contactId)
  }

  const now = () => {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const sendMessage = () => {
    const text = inputText().trim()
    if (!text) return

    const id = nextId()
    setNextId(id + 1)

    setMessages(prev => [...prev, {
      id,
      contactId: activeContact(),
      from: 'me',
      text,
      time: now(),
    }])
    setInputText('')

    // Typing indicator with cleanup-style pattern (setTimeout)
    setIsTyping(true)
    const replyId = id + 1
    setNextId(replyId + 1)

    setTimeout(() => {
      setIsTyping(false)
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)]
      setMessages(prev => [...prev, {
        id: replyId,
        contactId: activeContact(),
        from: 'them',
        text: reply,
        time: now(),
      }])
      showToast('New message received')
    }, 1500)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Messages</h2>
        {totalUnread() > 0 ? (
          <Badge variant="destructive" className="total-unread">{totalUnread()} unread</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">All caught up</span>
        )}
      </div>

      <div className="chat-container flex rounded-xl border border-border bg-card overflow-hidden" style="height: 480px">
        {/* Contact list */}
        <div className="contact-list w-[240px] border-r border-border flex flex-col">
          <div className="p-3">
            <Input
              placeholder="Search contacts..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredContacts().map(contact => (
                <button
                  key={contact.id}
                  className={`contact-item w-full flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent ${activeContact() === contact.id ? 'bg-accent' : ''}`}
                  onClick={() => switchContact(contact.id)}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>{contact.initials}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${statusColor[contact.status]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="contact-name text-sm font-medium truncate">{contact.name}</span>
                      {unreadCounts()[contact.id] > 0 ? (
                        <Badge variant="destructive" className="unread-badge ml-1 text-xs">{unreadCounts()[contact.id]}</Badge>
                      ) : null}
                    </div>
                    {lastMessages()[contact.id] ? (
                      <p className="last-message text-xs text-muted-foreground truncate">
                        {lastMessages()[contact.id].text}
                      </p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Message area */}
        <div className="message-area flex-1 flex flex-col">
          {/* Chat header */}
          <div className="chat-header flex items-center gap-3 px-4 py-3 border-b border-border">
            <Avatar>
              <AvatarFallback>
                {contacts.find(c => c.id === activeContact())?.initials || '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="active-contact-name text-sm font-semibold">
                {contacts.find(c => c.id === activeContact())?.name || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                {contacts.find(c => c.id === activeContact())?.status || 'offline'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="messages-list p-4 space-y-3">
              {contactMessages().map(msg => (
                <div
                  key={msg.id}
                  className={`message-bubble flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    msg.from === 'me'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="message-text text-sm">{msg.text}</p>
                    <p className={`message-time text-xs mt-1 ${
                      msg.from === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>{msg.time}</p>
                  </div>
                </div>
              ))}

              {/* Typing indicator — inside message list alongside the loop */}
              {isTyping() ? (
                <div className="typing-indicator flex justify-start">
                  <div className="bg-muted rounded-2xl px-4 py-2">
                    <div className="flex gap-1 items-center h-5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 0ms" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 150ms" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 300ms" />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Scroll anchor for auto-scroll */}
              <div ref={(el) => { messagesEndRef = el }} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="chat-input border-t border-border p-3 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={inputText()}
              onInput={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!inputText().trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>

      <ToastProvider position="bottom-right">
        <Toast variant="default" open={toastOpen()}>
          <div className="flex-1">
            <ToastTitle>Chat</ToastTitle>
            <ToastDescription className="toast-message">{toastMessage()}</ToastDescription>
          </div>
          <ToastClose onClick={() => setToastOpen(false)} />
        </Toast>
      </ToastProvider>
    </div>
  )
}
