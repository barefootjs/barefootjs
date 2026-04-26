/**
 * Builders for the per-arm Plan types in `loop-child-arm.ts`.
 *
 * Each builder takes the relevant slice of a `LoopChildBranchSummary` plus
 * the loop-param wrap parameters, and produces a fully-resolved Plan whose
 * stringifier never touches `wrapLoopParamAsAccessor`.
 */

import type { ConditionalBranchEvent } from '../../types'
import type {
  BranchEventBindingsPlan,
  BranchEventListener,
  BranchEventSlot,
} from './loop-child-arm'

export interface BuildBranchEventBindingsArgs {
  events: readonly ConditionalBranchEvent[] | undefined
  /** Loop-param wrap closure. Identity (`x => x`) when no loop param applies. */
  wrap: (expr: string) => string
}

/**
 * Group `ConditionalBranchEvent`s by slot id (preserving declaration order)
 * and pre-wrap each handler with the supplied loop-param wrap closure. The
 * slot order matches the legacy emitter's Map-iteration shape so output
 * stays byte-identical.
 */
export function buildBranchEventBindingsPlan(
  args: BuildBranchEventBindingsArgs,
): BranchEventBindingsPlan {
  const { events, wrap } = args
  if (!events || events.length === 0) return []

  const eventsBySlot = new Map<string, BranchEventListener[]>()
  for (const ev of events) {
    let bucket = eventsBySlot.get(ev.slotId)
    if (!bucket) {
      bucket = []
      eventsBySlot.set(ev.slotId, bucket)
    }
    bucket.push({
      eventName: ev.eventName,
      wrappedHandler: wrap(ev.handler),
    })
  }

  const slots: BranchEventSlot[] = []
  for (const [slotId, listeners] of eventsBySlot) {
    slots.push({ slotId, listeners })
  }
  return slots
}
