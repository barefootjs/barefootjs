/**
 * Counter fixture lifted from `integrations/shared/components/Counter.tsx`.
 *
 * The expectedHtml / expectedClientJs snapshots in
 * `fixtures/__snapshots__/counter-shared.{html,client.js}` are regenerated
 * by `scripts/snapshot-counter.ts`. They are the frozen pair the
 * fixture-hydrate layer (#1467) feeds into a real browser to verify the
 * client runtime hydrates and reacts correctly against known-good
 * compiler output.
 *
 * Interactions mirror the shared Playwright spec at
 * `integrations/shared/e2e/counter.spec.ts` so failures here narrow blame
 * to `packages/client/src/runtime/` rather than the wider end-to-end stack.
 *
 * Not yet wired into `fixtures/index.ts` — adapter-conformance's
 * Hono test renderer passes `__instanceId: 'test'`, which yields
 * `bf-s="test"`. Hydration requires `bf-s` to be `<Name>_<id>` so this
 * fixture's snapshot uses `Counter_test`. Reconciling the two
 * conventions is the #1466 corpus integration work and is intentionally
 * deferred — this fixture is consumed only by `e2e/fixture-hydrate.spec.ts`.
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFixture } from '../src/types'

const HERE = dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_DIR = resolve(HERE, '__snapshots__')
const SOURCE_PATH = resolve(
  HERE,
  '../../../integrations/shared/components/Counter.tsx',
)

export const fixture = createFixture({
  id: 'counter-shared',
  description:
    'Counter with createSignal/createMemo lifted from integrations/shared',
  source: readFileSync(SOURCE_PATH, 'utf8'),
  props: { initial: 0 },
  expectedHtml: readFileSync(
    resolve(SNAPSHOT_DIR, 'counter-shared.html'),
    'utf8',
  ),
  expectedClientJs: readFileSync(
    resolve(SNAPSHOT_DIR, 'counter-shared.client.js'),
    'utf8',
  ),
  interactions: [
    { type: 'expectText', selector: '.counter-value', text: '0' },
    { type: 'click', selector: '.btn-increment' },
    { type: 'expectText', selector: '.counter-value', text: '1' },
    { type: 'click', selector: '.btn-increment' },
    { type: 'expectText', selector: '.counter-value', text: '2' },
    { type: 'expectContains', selector: '.counter-doubled', text: '4' },
    { type: 'click', selector: '.btn-decrement' },
    { type: 'expectText', selector: '.counter-value', text: '1' },
    { type: 'click', selector: '.btn-reset' },
    { type: 'expectText', selector: '.counter-value', text: '0' },
    { type: 'expectContains', selector: '.counter-doubled', text: '0' },
  ],
})
