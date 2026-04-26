/**
 * `ref-callbacks` phase — invoke `(callback)(elem)` for each `ref` slot.
 *
 * Slots inside conditional branches are skipped — `insert(...)` bindEvents
 * runs the ref callback every time the branch swaps in.
 *
 * B3 of the post-#1054 emit-init maintainability plan.
 */

import type { ClientJsContext } from '../types'
import { varSlotId } from '../utils'

export function emitRefCallbacks(
  lines: string[],
  ctx: ClientJsContext,
  conditionalSlotIds: Set<string>,
): void {
  for (const elem of ctx.refElements) {
    if (conditionalSlotIds.has(elem.slotId)) continue
    const v = varSlotId(elem.slotId)
    lines.push(`  if (_${v}) (${elem.callback})(_${v})`)
  }
}
