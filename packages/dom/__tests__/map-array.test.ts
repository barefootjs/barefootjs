import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { createSignal, createEffect, createRoot } from '../src/reactive'
import { mapArray } from '../src/map-array'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('createRoot', () => {
  test('isolates signal tracking from parent effect', () => {
    const [count, setCount] = createSignal(0)
    let outerRuns = 0
    let innerRuns = 0

    createEffect(() => {
      outerRuns++
      createRoot(() => {
        createEffect(() => {
          innerRuns++
          count() // read inside inner root
        })
      })
    })

    expect(outerRuns).toBe(1)
    expect(innerRuns).toBe(1)

    setCount(1)
    // Inner effect re-runs (tracks count), outer does NOT re-run
    expect(outerRuns).toBe(1)
    expect(innerRuns).toBe(2)
  })

  test('dispose cleans up all child effects', () => {
    const [count, setCount] = createSignal(0)
    let runs = 0
    let disposeFn!: () => void

    createRoot((dispose) => {
      disposeFn = dispose
      createEffect(() => {
        runs++
        count()
      })
    })

    expect(runs).toBe(1)
    setCount(1)
    expect(runs).toBe(2)

    disposeFn()
    setCount(2)
    // Effect should not run after disposal
    expect(runs).toBe(2)
  })

  test('nested roots dispose independently', () => {
    const [a, setA] = createSignal(0)
    const [b, setB] = createSignal(0)
    let aRuns = 0
    let bRuns = 0
    let disposeInner!: () => void

    createRoot(() => {
      createEffect(() => { aRuns++; a() })

      createRoot((dispose) => {
        disposeInner = dispose
        createEffect(() => { bRuns++; b() })
      })
    })

    expect(aRuns).toBe(1)
    expect(bRuns).toBe(1)

    disposeInner()
    setB(1)
    expect(bRuns).toBe(1) // disposed, no re-run

    setA(1)
    expect(aRuns).toBe(2) // still active
  })
})

describe('mapArray', () => {
  let container: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    container = document.createElement('ul')
    document.body.appendChild(container)
  })

  test('renders initial items', () => {
    const [items] = createSignal([
      { id: '1', text: 'A' },
      { id: '2', text: 'B' },
    ])

    mapArray(
      items,
      container,
      (item) => item.id,
      (item) => {
        const li = document.createElement('li')
        li.textContent = item.text
        return li
      },
    )

    expect(container.children.length).toBe(2)
    expect(container.children[0].textContent).toBe('A')
    expect(container.children[1].textContent).toBe('B')
  })

  test('adds new items', () => {
    const [items, setItems] = createSignal([{ id: '1', text: 'A' }])

    mapArray(
      items,
      container,
      (item) => item.id,
      (item) => {
        const li = document.createElement('li')
        li.textContent = item.text
        return li
      },
    )

    expect(container.children.length).toBe(1)

    setItems([{ id: '1', text: 'A' }, { id: '2', text: 'B' }])

    expect(container.children.length).toBe(2)
    expect(container.children[0].textContent).toBe('A')
    expect(container.children[1].textContent).toBe('B')
  })

  test('removes items and disposes their scopes', () => {
    const [items, setItems] = createSignal([
      { id: '1', text: 'A' },
      { id: '2', text: 'B' },
      { id: '3', text: 'C' },
    ])

    mapArray(
      items,
      container,
      (item) => item.id,
      (item) => {
        const li = document.createElement('li')
        li.textContent = item.text
        return li
      },
    )

    setItems([{ id: '1', text: 'A' }, { id: '3', text: 'C' }])

    expect(container.children.length).toBe(2)
    expect(container.children[0].textContent).toBe('A')
    expect(container.children[1].textContent).toBe('C')
  })

  test('reorders items correctly', () => {
    const [items, setItems] = createSignal([
      { id: '1', text: 'A' },
      { id: '2', text: 'B' },
      { id: '3', text: 'C' },
    ])

    mapArray(
      items,
      container,
      (item) => item.id,
      (item) => {
        const li = document.createElement('li')
        li.textContent = item.text
        return li
      },
    )

    // Reverse order
    setItems([
      { id: '3', text: 'C' },
      { id: '2', text: 'B' },
      { id: '1', text: 'A' },
    ])

    expect(container.children.length).toBe(3)
    expect(container.children[0].textContent).toBe('C')
    expect(container.children[1].textContent).toBe('B')
    expect(container.children[2].textContent).toBe('A')
  })

  test('clears to empty', () => {
    const [items, setItems] = createSignal([{ id: '1', text: 'A' }])

    mapArray(
      items,
      container,
      (item) => item.id,
      (item) => {
        const li = document.createElement('li')
        li.textContent = item.text
        return li
      },
    )

    expect(container.children.length).toBe(1)

    setItems([])
    expect(container.children.length).toBe(0)
  })

  test('disposes item scope when item is removed', () => {
    const [items, setItems] = createSignal([{ id: '1', text: 'A' }])
    const [signal, setSignal] = createSignal(0)
    let effectRuns = 0

    mapArray(
      items,
      container,
      (item) => item.id,
      (item) => {
        const li = document.createElement('li')
        li.textContent = item.text
        // Create an effect inside the item scope
        createEffect(() => {
          effectRuns++
          signal() // track
        })
        return li
      },
    )

    expect(effectRuns).toBe(1)
    setSignal(1)
    expect(effectRuns).toBe(2)

    // Remove the item — its scope should be disposed
    setItems([])
    setSignal(2)
    // Effect should NOT run after item is removed
    expect(effectRuns).toBe(2)
  })
})
