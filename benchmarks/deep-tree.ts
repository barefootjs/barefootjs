/**
 * Deep-tree re-render benchmark (issue #1373)
 *
 * Measures the cost of a deeply nested component tree (depth 50/100/200)
 * that has a single reactive leaf, to establish a baseline and detect
 * pathological (super-linear) growth before it lands in user code.
 *
 * Each "level" models a BarefootJS component scope: a `createRoot` owner
 * wrapping a real DOM element, nested into its parent. The single signal
 * lives at the leaf with one effect writing the leaf's text — exactly the
 * "one reactive leaf" shape from the issue.
 *
 * Metrics, per the issue's DoD:
 *   - mount cost (build the whole tree)
 *   - single-signal-update propagation time to the leaf
 *   - GC behaviour after unmount (WeakRef liveness)
 *   - deep tree vs. shallow tree at the SAME total node count
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator'
GlobalRegistrator.register()

import {
  createSignal,
  createEffect,
  createRoot,
} from '../packages/client/src/index.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function measure(label: string, fn: () => void, iterations = 1): number {
  for (let i = 0; i < 3; i++) fn() // warm up
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    fn()
    times.push(performance.now() - start)
  }
  times.sort((a, b) => a - b)
  return times[Math.floor(times.length / 2)]
}

function report(label: string, ms: number, extra = '') {
  console.log(`  ${label.padEnd(48)} ${ms.toFixed(4)} ms${extra}`)
}

type Tree = {
  root: HTMLElement
  dispose: () => void
  setLeaf: (v: number) => void
  leafEffectRuns: () => number
}

/**
 * Build a tree of `depth` nested scopes, each scope having `width` child
 * scopes, until the configured total is reached. To keep "one reactive leaf"
 * honest, exactly one leaf carries the signal+effect; every other node is a
 * static DOM element inside its own owner scope.
 *
 * For the depth benchmark we use width=1 (a pure chain). For the shallow
 * comparison we use depth=1 and width=N.
 */
function buildTree(depth: number, width: number): Tree {
  const [leaf, setLeaf] = createSignal(0)
  let runs = 0
  let dispose!: () => void
  let leafEl!: HTMLElement

  createRoot((d) => {
    dispose = d
    const root = document.createElement('div')

    // Recursively build nested owner scopes + DOM.
    const build = (parentEl: HTMLElement, level: number) => {
      if (level >= depth) return
      for (let w = 0; w < width; w++) {
        // Each level is its own reactive scope, like a component boundary.
        createRoot(() => {
          const el = document.createElement('div')
          parentEl.appendChild(el)
          build(el, level + 1)
        })
      }
    }
    build(root, 0)

    // Attach the single reactive leaf at the deepest node.
    leafEl = root
    while (leafEl.firstElementChild) leafEl = leafEl.firstElementChild as HTMLElement
    createEffect(() => {
      runs++
      leafEl.textContent = String(leaf())
    })

    ;(root as unknown as { __keep: HTMLElement }).__keep = root
    rootHolder = root
  })

  return {
    root: rootHolder,
    dispose,
    setLeaf,
    leafEffectRuns: () => runs,
  }
}
let rootHolder!: HTMLElement

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

console.log('\n=== Deep-tree re-render benchmark (#1373) ===\n')

const DEPTHS = [50, 100, 200]
const UPDATES = 10_000

console.log('--- Deep chain: depth D, width 1, single reactive leaf ---')
for (const depth of DEPTHS) {
  // Mount cost (fresh tree each iteration).
  const mountMs = measure(`mount depth=${depth}`, () => {
    const t = buildTree(depth, 1)
    t.dispose()
  }, 50)

  // Update propagation: one persistent tree, set the leaf signal repeatedly.
  const t = buildTree(depth, 1)
  const baseRuns = t.leafEffectRuns()
  let v = 0
  const updateMs = measure(`update depth=${depth}`, () => {
    t.setLeaf(++v)
  }, UPDATES)
  const ranPerUpdate = (t.leafEffectRuns() - baseRuns) / UPDATES
  t.dispose()

  report(`mount  (depth ${depth})`, mountMs)
  report(`update→leaf (depth ${depth})`, updateMs, `  [${ranPerUpdate.toFixed(2)} effect runs/update]`)
}

console.log('\n--- Shallow vs deep at SAME node count (N=200) ---')
{
  const N = 200
  const deep = buildTree(N, 1) // depth 200, 1 wide
  const shallow = buildTree(1, N) // depth 1, 200 wide — but leaf is one of them

  let v = 0
  const deepMs = measure('update deep (200×1)', () => deep.setLeaf(++v), UPDATES)
  const shallowMs = measure('update shallow (1×200)', () => shallow.setLeaf(++v), UPDATES)
  report('update→leaf deep    (depth 200)', deepMs)
  report('update→leaf shallow (depth 1)  ', shallowMs)

  const mountDeep = measure('mount deep (200×1)', () => { const t = buildTree(N, 1); t.dispose() }, 50)
  const mountShallow = measure('mount shallow (1×200)', () => { const t = buildTree(1, N); t.dispose() }, 50)
  report('mount deep    (depth 200)', mountDeep)
  report('mount shallow (depth 1)  ', mountShallow)

  deep.dispose()
  shallow.dispose()
}

console.log('\n--- GC after unmount (WeakRef liveness) ---')
{
  const depth = 200
  const t = buildTree(depth, 1)
  const ref = new WeakRef(t.root)
  let leaf: HTMLElement = t.root
  while (leaf.firstElementChild) leaf = leaf.firstElementChild as HTMLElement
  const leafRef = new WeakRef(leaf)

  t.dispose()
  rootHolder = null as unknown as HTMLElement
  // drop strong refs
  ;(t as unknown as { root: HTMLElement | null }).root = null

  await Bun.sleep(0)
  Bun.gc(true)
  await Bun.sleep(0)
  Bun.gc(true)

  const rootAlive = ref.deref() !== undefined
  const leafAlive = leafRef.deref() !== undefined
  console.log(`  root node after GC: ${rootAlive ? 'ALIVE (potential leak)' : 'collected ✓'}`)
  console.log(`  leaf node after GC: ${leafAlive ? 'ALIVE (potential leak)' : 'collected ✓'}`)
}

console.log('')
