/**
 * Stringifiers for the per-arm Plans defined in `plan/loop-child-arm.ts`.
 *
 * Item 2 of `tmp/emit-survey/HANDOFF.md` migrates the recursive
 * branch ↔ loop ↔ conditional helpers from `legacy-helpers.ts` into Plan +
 * stringify pairs. This file grows one stringifier at a time as each helper
 * is migrated.
 *
 * Output shapes are preserved byte-for-byte against the corresponding legacy
 * helper. Indent is taken as a parameter so the same stringifier works at
 * every nesting depth.
 */

import { varSlotId } from '../../utils'
import { emitListenerLine } from './event-listener'
import type { BranchEventBindingsPlan } from '../plan/loop-child-arm'

/**
 * Emit `addEventListener` setup for a loop-cond branch arm. One qsa() per
 * slot, then one listener line per (slotId, eventName) pair. The closing
 * brace lives on its own line to keep each `emitListenerLine` call uniform —
 * a deliberate departure from the very oldest legacy emitter (which closed
 * the brace inline with the last listener line) but consistent with the
 * post-PR-1045 listener-emission shape.
 */
export function stringifyBranchEventBindings(
  lines: string[],
  plan: BranchEventBindingsPlan,
  indent: string,
): void {
  for (const slot of plan) {
    const v = varSlotId(slot.slotId)
    // qsa() (not $()) because __branchScope is the loop-item element itself
    // and may not carry a bf-s attribute — scope-aware $() would walk to the
    // nearest bf-s and miss descendants in that case.
    lines.push(`${indent}{ const _${v} = qsa(__branchScope, '[bf="${slot.slotId}"]')`)
    for (const ev of slot.listeners) {
      emitListenerLine(lines, `${indent}  `, `_${v}`, ev.eventName, ev.wrappedHandler)
    }
    lines.push(`${indent}}`)
  }
}
