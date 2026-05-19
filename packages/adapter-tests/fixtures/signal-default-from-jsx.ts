import { createFixture } from '../src/types'

// (#1423) JSX-time signal default propagates to SSR when the caller
// supplies no value. Pairs with the Mojo manifest_defaults coverage
// (#1419) — the Go adapter's `NewXxxProps` must apply the `?? 7`
// fallback when `in.X` is the Go zero, otherwise the SSR HTML renders
// `0` while the JSX-side default is `7`. The memo `() => x() + 1`
// must inherit the fallback and land at `8`.
//
// `props` is intentionally omitted: the fixture exercises the
// no-props path where the JSX-time fallback is the sole source of
// truth.
export const fixture = createFixture({
  id: 'signal-default-from-jsx',
  description: 'JSX-time signal default propagates to SSR when caller omits the prop (#1423)',
  source: `
'use client'
import { createSignal, createMemo } from '@barefootjs/client'
export function SignalDefaultFromJsx(props: { x?: number }) {
  const [x, setX] = createSignal(props.x ?? 7)
  const incremented = createMemo(() => x() + 1)
  return <div><span>{x()}</span><span>{incremented()}</span></div>
}
`,
  expectedHtml: `
    <div bf-s="test">
      <span bf="s1"><!--bf:s0-->7<!--/--></span>
      <span bf="s3"><!--bf:s2-->8<!--/--></span>
    </div>
  `,
})
