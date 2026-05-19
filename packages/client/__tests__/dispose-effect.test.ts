/**
 * Effect disposal contract — covers #1366 (rAF) and #1367 (async / Suspense).
 *
 * The shared invariant is: once a scope is disposed, no late callback —
 * whether from `requestAnimationFrame`, a Promise resolution, a
 * `setTimeout`, or a `createResource` body when that primitive lands —
 * can resurrect effects owned by the disposed scope. The mechanism is
 * the cleanup chain in `disposeEffect`: cancel any handle the user
 * registered via `onCleanup`, and (defensively) remove every owned
 * effect from its signals' subscriber sets so late `setSignal` calls
 * are inert against the disposed subtree.
 *
 * The Pulse repro from #1366 is the rAF instance of this contract; the
 * `createResource` / `Suspense` repro from #1367 is the Promise
 * instance. The same primitives are responsible for both.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { createSignal, createEffect, createRoot, onCleanup } from '../src/reactive'

describe('disposeEffect — cleanup chain and late-write isolation', () => {
  let originalRAF: typeof globalThis.requestAnimationFrame | undefined
  let originalCAF: typeof globalThis.cancelAnimationFrame | undefined
  let frames: Map<number, FrameRequestCallback>
  let nextHandle: number

  beforeEach(() => {
    frames = new Map()
    nextHandle = 1
    originalRAF = globalThis.requestAnimationFrame
    originalCAF = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      const h = nextHandle++
      frames.set(h, cb)
      return h
    }) as typeof globalThis.requestAnimationFrame
    globalThis.cancelAnimationFrame = ((h: number) => {
      frames.delete(h)
    }) as typeof globalThis.cancelAnimationFrame
  })

  afterEach(() => {
    // `globalThis.requestAnimationFrame` is `undefined` in pure-bun test
    // environments. Restore by `delete` in that case so the stub doesn't
    // leak into sibling test files that share this bun process.
    if (originalRAF === undefined) {
      delete (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame
    } else {
      globalThis.requestAnimationFrame = originalRAF
    }
    if (originalCAF === undefined) {
      delete (globalThis as { cancelAnimationFrame?: unknown }).cancelAnimationFrame
    } else {
      globalThis.cancelAnimationFrame = originalCAF
    }
  })

  function tickFrame() {
    const pending = [...frames.values()]
    frames.clear()
    for (const cb of pending) cb(performance.now())
  }

  test('onCleanup cancels the rAF handle when scope disposes before frame fires', () => {
    let callbackFired = false
    let disposeFn!: () => void

    createRoot((dispose) => {
      disposeFn = dispose
      createEffect(() => {
        const h = requestAnimationFrame(() => {
          callbackFired = true
        })
        onCleanup(() => cancelAnimationFrame(h))
      })
    })

    expect(frames.size).toBe(1)

    disposeFn()
    expect(frames.size).toBe(0)

    tickFrame()
    expect(callbackFired).toBe(false)
  })

  test('Pulse-style: signal-writing rAF callback cancelled before next frame (#1366)', () => {
    // Mirrors the issue's repro exactly: a reader effect subscribes to
    // the signal (the {t()} text bind in the JSX body), and a writer
    // effect schedules an rAF that calls setT. Synchronous dispose
    // between schedule and frame must produce zero reader re-runs.
    const [t, setT] = createSignal(0)
    let readerRuns = 0
    let writerFired = false
    let disposeFn!: () => void

    createRoot((dispose) => {
      disposeFn = dispose
      createEffect(() => {
        readerRuns++
        t()
      })
      createEffect(() => {
        const h = requestAnimationFrame(() => {
          writerFired = true
          setT(performance.now())
        })
        onCleanup(() => cancelAnimationFrame(h))
      })
    })

    expect(readerRuns).toBe(1)
    expect(frames.size).toBe(1)

    disposeFn()
    tickFrame()

    expect(writerFired).toBe(false)
    expect(readerRuns).toBe(1)
  })

  test('without onCleanup, a leaked rAF cannot re-run a disposed reader', () => {
    // Defensive invariant: if the user forgets onCleanup the rAF *does*
    // fire post-dispose, but disposeEffect already removed the reader
    // from the signal's subscribers Set, so the write is observable
    // only as a stored value — no owned effect re-runs.
    const [t, setT] = createSignal(0)
    let readerRuns = 0
    let disposeFn!: () => void

    createRoot((dispose) => {
      disposeFn = dispose
      createEffect(() => {
        readerRuns++
        t()
      })
      createEffect(() => {
        requestAnimationFrame(() => setT(performance.now()))
        // intentionally no onCleanup
      })
    })

    expect(readerRuns).toBe(1)

    disposeFn()
    tickFrame()

    expect(readerRuns).toBe(1)
  })

  test('late Promise resolution cannot re-run a disposed reader (#1367)', async () => {
    // Mirrors the createResource / Suspense scenario from #1367: a
    // pending async write resolves into a scope that was already
    // disposed. The reader effect (signal subscriber) must have been
    // unsubscribed on dispose, so the late setSignal is a no-op
    // against the subtree — equivalent to Solid's Owner.cancelled
    // contract but implemented at the subscriber level.
    const [data, setData] = createSignal<string | null>(null)
    let readerRuns = 0
    let disposeFn!: () => void

    createRoot((dispose) => {
      disposeFn = dispose
      createEffect(() => {
        readerRuns++
        data()
      })
      // Stand-in for `fetch(...).then(setData)` inside a Suspense body.
      Promise.resolve('done').then((v) => setData(v))
    })

    expect(readerRuns).toBe(1)

    disposeFn()
    await Promise.resolve() // let the queued .then fire setData

    expect(readerRuns).toBe(1)
    // Signal value still got written — only the *effect chain* is
    // isolated. Direct readers outside the scope (none here) would
    // observe the new value, which matches Solid's semantics.
    expect(data()).toBe('done')
  })

  test('rAF scheduled before an effect re-run is cancelled by the previous cleanup', () => {
    // An effect that reads a signal AND schedules an rAF: each re-run
    // must cancel the previous frame's handle, otherwise a flood of
    // setSignal-driven re-runs leaks rAF handles.
    const [trigger, setTrigger] = createSignal(0)
    const scheduled: number[] = []
    const cancelled: number[] = []

    let disposeFn!: () => void
    createRoot((dispose) => {
      disposeFn = dispose
      createEffect(() => {
        trigger()
        const h = requestAnimationFrame(() => {})
        scheduled.push(h)
        onCleanup(() => {
          cancelled.push(h)
          cancelAnimationFrame(h)
        })
      })
    })

    expect(scheduled).toHaveLength(1)
    expect(cancelled).toHaveLength(0)

    setTrigger(1)
    // re-run cleanup'd the previous handle before scheduling a new one
    expect(scheduled).toHaveLength(2)
    expect(cancelled).toEqual([scheduled[0]])

    disposeFn()
    expect(cancelled).toEqual([scheduled[0], scheduled[1]])
    expect(frames.size).toBe(0)
  })
})
