/**
 * Builders for the per-arm Plan types in `loop-child-arm.ts`.
 *
 * Each builder takes the relevant slice of a `LoopChildBranchSummary` plus
 * the loop-param wrap parameters, and produces a fully-resolved Plan whose
 * stringifier never touches `wrapLoopParamAsAccessor`.
 */

import type { ConditionalBranchEvent } from '../../types'
import type { IRNode, IRProp } from '../../../types'
import { quotePropName } from '../../utils'
import { irChildrenToJsExpr } from '../../html-template'
import type {
  BranchChildComponentInit,
  BranchChildComponentInitsPlan,
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

/** A loose shape for one child component inside a conditional branch IR. */
export interface BranchComponentLike {
  name: string
  slotId: string | null
  props: IRProp[]
  children?: IRNode[]
}

export interface BuildBranchChildComponentInitsArgs {
  components: readonly BranchComponentLike[]
  /** Loop-param wrap closure. Identity (`x => x`) when no loop param applies. */
  wrap: (expr: string) => string
}

/**
 * Pre-build the per-component data needed to emit `initChild` / placeholder
 * replacement lines inside a conditional branch's `bindEvents`. The selector,
 * placeholder id, and props expression are all resolved here so the
 * stringifier emits one line per entry.
 */
export function buildBranchChildComponentInitsPlan(
  args: BuildBranchChildComponentInitsArgs,
): BranchChildComponentInitsPlan {
  const { components, wrap } = args
  const inits: BranchChildComponentInit[] = []
  for (const comp of components) {
    // Use slotId suffix match when available so two siblings of the same
    // component type with different slotIds don't collide.
    const selector = comp.slotId
      ? `[bf-s$="_${comp.slotId}"]`
      : `[bf-s^="~${comp.name}_"]`

    const propsEntries = comp.props
      .filter(p => p.name !== 'key')
      .map(p => {
        if (p.name.startsWith('on') && p.name.length > 2) {
          return `${quotePropName(p.name)}: ${wrap(p.value)}`
        }
        if (p.isLiteral) {
          return `get ${quotePropName(p.name)}() { return ${JSON.stringify(p.value)} }`
        }
        return `get ${quotePropName(p.name)}() { return ${wrap(p.value)} }`
      })

    // Children are needed for CSR createComponent; SSR initChild ignores them
    // (text already lives in the rendered HTML).
    const childrenExpr = comp.children?.length ? irChildrenToJsExpr(comp.children) : null
    if (childrenExpr) {
      propsEntries.push(`get children() { return ${wrap(childrenExpr)} }`)
    }
    const propsExpr = propsEntries.length > 0 ? `{ ${propsEntries.join(', ')} }` : '{}'

    inits.push({
      name: comp.name,
      selector,
      placeholderId: comp.slotId || comp.name,
      propsExpr,
    })
  }
  return inits
}
