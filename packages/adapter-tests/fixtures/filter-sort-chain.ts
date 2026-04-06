import { createFixture } from '../src/types'

export const fixture = createFixture({
  id: 'filter-sort-chain',
  description: 'Chained filter and sort before map',
  source: `
'use client'
import { createSignal } from '@barefootjs/dom'
type Product = { name: string; price: number; active: boolean }
export function FilterSortChain() {
  const [products, setProducts] = createSignal<Product[]>([])
  return <ul>{products().filter(p => p.active).sort((a, b) => a.price - b.price).map(p => <li>{p.name}</li>)}</ul>
}
`,
  expectedHtml: `
    <ul bf-s="test" bf="s1"></ul>
  `,
})
