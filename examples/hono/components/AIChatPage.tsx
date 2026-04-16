/**
 * AI Chat Page — Streaming SSR Example
 *
 * Demonstrates BfAsync streaming: the chat history loads asynchronously
 * while a skeleton UI is shown immediately for fast TTFB.
 */

import { BfAsync } from '@barefootjs/hono/async'
import Counter from '@/components/Counter'

// ---------------------------------------------------------------------------
// Mock AI Chat Data
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

async function fetchChatHistory(): Promise<ChatMessage[]> {
  // Simulate slow API call (e.g., loading from database)
  await new Promise(resolve => setTimeout(resolve, 1500))
  return [
    { id: 1, role: 'user',      content: 'BarefootJSとは何ですか？',                                              timestamp: '14:01' },
    { id: 2, role: 'assistant',  content: 'BarefootJSは、JSXをMarked Template + Client JSにコンパイルするフレームワークです。Signal-based reactivityをどのバックエンドでも使えるようにします。', timestamp: '14:01' },
    { id: 3, role: 'user',      content: 'Streaming SSRはどう動きますか？',                                         timestamp: '14:02' },
    { id: 4, role: 'assistant',  content: 'Out-of-Order Streamingプロトコルを使います。サーバーはまずfallback UIを送信し、データが準備できたら<template>チャンクを追記します。クライアントの__bf_swap()がfallbackを実コンテンツに差し替え、ハイドレーションをトリガーします。', timestamp: '14:02' },
    { id: 5, role: 'user',      content: 'どのバックエンドで使えますか？',                                           timestamp: '14:03' },
    { id: 6, role: 'assistant',  content: 'HTTP chunked transfer encodingをサポートするすべてのバックエンドで動作します。Hono、Go (Echo)、Perl (Mojolicious) などのアダプタが用意されています。', timestamp: '14:03' },
  ]
}

async function fetchSuggestedQuestions(): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 800))
  return [
    'コンポーネントの作り方を教えて',
    'Signalの仕組みは？',
    'テストはどう書く？',
  ]
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ChatSkeleton() {
  return (
    <div className="chat-skeleton">
      <div className="skeleton-msg skeleton-user"><div className="skeleton-line" style="width:60%" /></div>
      <div className="skeleton-msg skeleton-bot"><div className="skeleton-line" style="width:90%" /><div className="skeleton-line" style="width:70%" /></div>
      <div className="skeleton-msg skeleton-user"><div className="skeleton-line" style="width:50%" /></div>
      <div className="skeleton-msg skeleton-bot"><div className="skeleton-line" style="width:85%" /><div className="skeleton-line" style="width:60%" /></div>
    </div>
  )
}

function SuggestionsSkeleton() {
  return (
    <div className="suggestions-skeleton">
      <div className="skeleton-chip" /><div className="skeleton-chip" /><div className="skeleton-chip" />
    </div>
  )
}

async function ChatHistory() {
  const messages = await fetchChatHistory()
  return (
    <div className="chat-messages">
      {messages.map(msg => (
        <div key={msg.id} className={`chat-msg chat-${msg.role}`}>
          <div className="chat-bubble">
            <p>{msg.content}</p>
            <time>{msg.timestamp}</time>
          </div>
        </div>
      ))}
    </div>
  )
}

async function SuggestedQuestions() {
  const questions = await fetchSuggestedQuestions()
  return (
    <div className="chat-suggestions">
      {questions.map(q => (
        <button key={q} className="suggestion-chip">{q}</button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function AIChatPage() {
  return (
    <div>
      <h1>AI Chat — Streaming SSR</h1>

      <div className="chat-container">
        <BfAsync fallback={<ChatSkeleton />}>
          <ChatHistory />
        </BfAsync>

        <BfAsync fallback={<SuggestionsSkeleton />}>
          <SuggestedQuestions />
        </BfAsync>

        <div className="chat-input-area">
          <input type="text" className="chat-input" placeholder="メッセージを入力..." disabled />
          <button className="chat-send" disabled>送信</button>
        </div>
      </div>

      <div style="margin-top:2rem">
        <h2>Interactive Component (hydrated after streaming)</h2>
        <Counter />
      </div>

      <p><a href="/">← Back</a></p>
    </div>
  )
}
