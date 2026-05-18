// Cross-adapter dev-reload contract for `create-barefootjs` scaffolds.
//
// Every adapter (Mojo, Hono Node, Hono CF, Echo) must wire up a
// browser-side reload subscriber when the app is started in dev mode,
// and must keep that wiring OFF in production. Each adapter satisfies
// the contract with adapter-specific machinery (see the
// `scaffold.test.ts` in each adapter package for how the facts below
// are computed from each adapter's output), but the contract itself is
// adapter-agnostic.
//
// Run this contract from each adapter's `scaffold.test.ts` by
// computing the facts from that adapter's scaffold output and passing
// them to `assertDevReloadContract`. The facts type intentionally
// avoids adapter-specific terminology so a new adapter can be added
// without changing the contract surface — only the per-adapter
// fact-extraction logic.

import { expect } from 'bun:test'

export interface DevReloadFacts {
  /**
   * The scaffold output subscribes the browser to a dev-reload signal.
   * Adapters satisfy this through different mechanisms:
   *   - Mojo: `bf_dev_snippet` in the layout (registered by
   *     `BarefootJS::DevReload` plugin).
   *   - Hono Node: `<BfDevReload />` in the layout + the
   *     `barefootDevReload` middleware on the app.
   *   - Hono CF: `wrangler dev --live-reload` (no scaffold-side
   *     snippet — wrangler injects its own reload client).
   *   - Echo: an EventSource-based snippet emitted by the server
   *     when `BAREFOOT_DEV=1`.
   * Every adapter answers `true` — the contract enforces this.
   */
  subscribesBrowserInDev: boolean
  /**
   * The dev-reload wiring is OFF in production builds / runs. May be
   * enforced via a runtime gate (`app->mode ne 'production'` /
   * `NODE_ENV !== 'production'`), through tooling that only runs in
   * dev (wrangler dev), or both. The point: production output must
   * not carry the reload subscriber.
   */
  gatedToDev: boolean
  /**
   * When the adapter uses the shared `bf build --watch` ↔
   * `<distDir>/.dev/build-id` SSE protocol (Mojo / Hono Node / Echo),
   * this is the endpoint path (e.g. `/_bf/reload`). When the adapter
   * uses a different mechanism (Hono CF / wrangler dev), this is
   * `null` — the contract still requires `subscribesBrowserInDev`
   * and `gatedToDev`, but the protocol details are not in scope.
   */
  sentinelSseEndpoint: string | null
}

/**
 * Assert that an adapter's scaffold output satisfies the dev-reload
 * contract. Call from each adapter's `scaffold.test.ts` after
 * extracting the facts from that adapter's output files.
 *
 * Failure messages intentionally name the fact rather than the
 * scaffold file so a contract violation points at the contract
 * surface; the per-adapter test should also assert the adapter-
 * specific wiring directly (e.g. `expect(app).toContain('bf_dev_snippet')`)
 * so a regression points at the exact line of scaffold output that
 * regressed.
 */
export function assertDevReloadContract(facts: DevReloadFacts): void {
  expect(facts.subscribesBrowserInDev).toBe(true)
  expect(facts.gatedToDev).toBe(true)
  if (facts.sentinelSseEndpoint !== null) {
    // Shape-check the endpoint string when the adapter opts into the
    // shared SSE protocol. The wrangler-based path opts out by
    // returning `null` above.
    expect(facts.sentinelSseEndpoint.startsWith('/')).toBe(true)
  }
}
