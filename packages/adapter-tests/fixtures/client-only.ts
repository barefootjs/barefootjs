import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'client-only',
  description: 'Client-only directive suppresses SSR for expression',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
type Item = { name: string; tags: string[] }
export function ClientOnly() {
  const [items, setItems] = createSignal<Item[]>([])
  return (
    <ul>
      {/* @client */ items().filter(item => item.tags.includes('featured')).map(item => (
        <li>{item.name}</li>
      ))}
    </ul>
  )
}
`,
  expectedHtml: `
    <ul bf-s="test" bf="s1"></ul>
  `,
})
