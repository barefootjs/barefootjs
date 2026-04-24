/**
 * Async Infinite Scroll Reference Page (/components/infinite-scroll)
 *
 * Block-level composition pattern: <Async> streaming boundary wraps a
 * signal-driven items().map(), exercising the IRAsync + IRMap compiler path.
 * IntersectionObserver triggers next-page fetch; per-item like/save actions
 * test reactive immutable updates inside a growing mapArray. Effect cleanup
 * (observer.disconnect) and error / empty-state branches round out the coverage.
 */

import { InfiniteScrollDemo } from '@/components/infinite-scroll-demo'
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

import { createSignal, createMemo, onMount, onCleanup } from '@barefootjs/client'

type Article = { id: number; title: string; liked: boolean; saved: boolean; /* ... */ }
type FetchStatus = 'idle' | 'loading' | 'error' | 'end'

export function InfiniteScrollDemo() {
  const [items, setItems] = createSignal<Article[]>(INITIAL_ITEMS)
  const [cursor, setCursor] = createSignal(1)
  const [status, setStatus] = createSignal<FetchStatus>('idle')

  const totalCount = createMemo(() => items().length)
  const likedCount = createMemo(() => items().filter(a => a.liked).length)

  const toggleLike = (id: number) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, liked: !a.liked } : a))
  }

  const loadMore = async () => {
    if (status() === 'loading' || status() === 'end') return
    setStatus('loading')
    try {
      const newItems = await fetchPage(cursor())
      setItems(prev => [...prev, ...newItems]) // mapArray append
      setCursor(c => c + 1)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  onMount(() => {
    const sentinel = document.querySelector('.is-sentinel')
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinel!)
    onCleanup(() => observer.disconnect()) // effect cleanup on unmount
  })

  return (
    <div>
      <div>{totalCount()} articles · {likedCount()} liked</div>

      {/* <Async> boundary — IRAsync wrapping a signal-driven map */}
      <Async fallback={<ArticleSkeleton />}>
        <div data-slot="article-list">
          {items().map(article => (
            <article key={article.id}>
              <h3>{article.title}</h3>
              <button
                aria-pressed={article.liked ? 'true' : 'false'}
                onClick={() => toggleLike(article.id)}
              >
                {article.liked ? '♥' : '♡'}
              </button>
            </article>
          ))}
        </div>
      </Async>

      {/* Sentinel + status branches */}
      <div className="is-sentinel">
        {status() === 'loading' ? <p>Loading…</p> : null}
        {status() === 'error'   ? <button onClick={loadMore}>Retry</button> : null}
        {status() === 'end'     ? <p>You have reached the end · {totalCount()} articles</p> : null}
      </div>
    </div>
  )
}`

export function InfiniteScrollRefPage() {
  return (
    <DocPage slug="infinite-scroll" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Async Infinite Scroll"
          description="IntersectionObserver-triggered pagination with <Async> streaming boundary, mapArray append, per-item like/save actions, and effect cleanup on unmount. Tests the IRAsync + mapArray compiler path, reactive list growth, and error/empty-state branches."
          {...getNavLinks('infinite-scroll')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <InfiniteScrollDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                {'<Async>'} Boundary + mapArray
              </h3>
              <p className="text-sm text-muted-foreground">
                The initial article list is wrapped in an{' '}
                <code className="text-xs">{'<Async fallback={skeleton}>'}</code> boundary.
                In SSR the compiler emits a{' '}
                <code className="text-xs">{'<Suspense>'}</code> node (IRAsync → Hono
                adapter) containing the{' '}
                <code className="text-xs">items().map()</code> loop.
                This exercises the IRAsync + IRMap compiler path that was previously
                untested by any block demo.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                IntersectionObserver + Effect Cleanup
              </h3>
              <p className="text-sm text-muted-foreground">
                <code className="text-xs">onMount</code> registers an{' '}
                <code className="text-xs">IntersectionObserver</code> on the sentinel
                div at the bottom of the list.{' '}
                <code className="text-xs">onCleanup(() =&gt; observer.disconnect())</code>{' '}
                ensures the observer is torn down if the component unmounts mid-fetch,
                preventing stale callbacks and memory leaks.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                mapArray Append
              </h3>
              <p className="text-sm text-muted-foreground">
                Each page load calls{' '}
                <code className="text-xs">
                  setItems(prev =&gt; [...prev, ...newItems])
                </code>
                , appending to the existing signal array.
                BarefootJS's client-side <code className="text-xs">mapArray</code>{' '}
                reconciles the new items by keyed diffing — only the new DOM nodes
                are created; existing article cards are not re-rendered.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                Error and Empty States
              </h3>
              <p className="text-sm text-muted-foreground">
                A{' '}
                <code className="text-xs">
                  createSignal{'<FetchStatus>'}
                </code>{' '}
                drives three conditional branches:{' '}
                <code className="text-xs">loading</code> (spinner),{' '}
                <code className="text-xs">error</code> (retry button), and{' '}
                <code className="text-xs">end</code> (end-of-list message).
                The 12% simulated error rate makes the retry branch reachable
                during testing.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                Per-Item Reactive Actions
              </h3>
              <p className="text-sm text-muted-foreground">
                Each article card has like and save toggles that call{' '}
                <code className="text-xs">
                  setItems(prev =&gt; prev.map(a =&gt; a.id === id ? ...))
                </code>
                , an immutable update inside a reactive loop.{' '}
                <code className="text-xs">createMemo</code> chains derive
                aggregate counts (liked, saved) from the items signal,
                updating the stats bar reactively.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
