/**
 * Unified snapshot CLI for shared-component fixtures — thin wrapper
 * around `src/snapshot-generator.ts`. The auto-update workflow calls
 * the library directly from `generate-expected-html.ts`; this script
 * stays for interactive `bun run` invocations.
 *
 * Usage:
 *   bun run packages/adapter-tests/scripts/snapshot.ts             # all fixtures
 *   bun run packages/adapter-tests/scripts/snapshot.ts counter-shared toggle-shared
 */

import { generateAllSharedComponentSnapshots } from '../src/snapshot-generator'

const requested = process.argv.slice(2)
await generateAllSharedComponentSnapshots(
  requested.length > 0 ? { ids: requested } : undefined,
)
