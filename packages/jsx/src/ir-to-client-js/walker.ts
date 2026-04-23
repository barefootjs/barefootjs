/**
 * Generic IR tree walker with declarative per-node-kind visitors and
 * explicit scope threading.
 *
 * Purpose (Phase 4 of the collectElements modularization epic, #999):
 * every collector in this directory used to re-implement its own
 * `switch (node.type)` over the 10 `IRNode` kinds, each with its own
 * stop-rule wiring. Adding a new kind (most recently `IRAsync`) required
 * editing every walker by hand. This module centralises the fan-out so
 * new kinds compile-check into every visitor at once via `assertNever`
 * in the default arm.
 *
 * Design:
 * - Per-kind optional callbacks on `IRVisitor<Scope>`.
 * - When a callback is **absent**, `walkIR` descends into the node's
 *   default children with the same scope.
 * - When a callback is **present**, it takes full control: it receives
 *   `descend(scope?)` (recurses into default children, optionally with
 *   a new scope) and `walk(node, scope)` (surgical traversal of any
 *   subtree with any scope). The visitor is responsible for calling
 *   one of these if it wants recursion — explicit descent mirrors how
 *   every existing walker already works.
 * - Component `prop.jsxChildren` are NOT part of default descent.
 *   Visitors that need them call `descendJsxChildren(scope?)` from the
 *   component visit context. Matches the pre-Phase-4 behaviour where
 *   only `collectElements` descended into JSX prop children.
 *
 * Not a goal: subsuming Phase 1 transformations (`jsx-to-ir.ts`). Scope
 * is strictly `packages/jsx/src/ir-to-client-js/`.
 */

import type {
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IRSlot,
  IRFragment,
  IRIfStatement,
  IRProvider,
  IRAsync,
} from '../types'

/**
 * Arguments passed to every per-kind visitor callback.
 *
 * `descend(nextScope?)` recurses into the node's default children with
 * the given scope (or the current one). For `component` nodes,
 * `descendJsxChildren(nextScope?)` additionally walks every JSX prop
 * value's child subtree.
 *
 * `walk(node, scope)` escapes the default descent pattern for callers
 * that need surgical traversal (e.g. conditional-branch collectors that
 * descend only into `whenTrue` or only into `whenFalse`).
 */
export interface VisitContext<Scope, Node extends IRNode> {
  readonly node: Node
  readonly scope: Scope
  descend(nextScope?: Scope): void
  walk(node: IRNode, scope?: Scope): void
}

/** Additional affordance exposed only for `IRComponent` visitors. */
export interface ComponentVisitContext<Scope> extends VisitContext<Scope, IRComponent> {
  /** Walk every JSX child subtree across every `prop.jsxChildren` on this component. */
  descendJsxChildren(nextScope?: Scope): void
}

export interface IRVisitor<Scope> {
  element?(ctx: VisitContext<Scope, IRElement>): void
  text?(ctx: VisitContext<Scope, IRText>): void
  expression?(ctx: VisitContext<Scope, IRExpression>): void
  conditional?(ctx: VisitContext<Scope, IRConditional>): void
  loop?(ctx: VisitContext<Scope, IRLoop>): void
  component?(ctx: ComponentVisitContext<Scope>): void
  slot?(ctx: VisitContext<Scope, IRSlot>): void
  fragment?(ctx: VisitContext<Scope, IRFragment>): void
  ifStatement?(ctx: VisitContext<Scope, IRIfStatement>): void
  provider?(ctx: VisitContext<Scope, IRProvider>): void
  async?(ctx: VisitContext<Scope, IRAsync>): void
}

/** Recurse into the default children of `node` with the given scope. */
function descendDefault<Scope>(
  node: IRNode,
  scope: Scope,
  walk: (n: IRNode, s: Scope) => void,
): void {
  switch (node.type) {
    case 'element':
    case 'fragment':
    case 'component':
    case 'provider':
    case 'async':
    case 'loop':
      for (const child of node.children) walk(child, scope)
      return
    case 'conditional':
      walk(node.whenTrue, scope)
      walk(node.whenFalse, scope)
      return
    case 'if-statement':
      walk(node.consequent, scope)
      if (node.alternate) walk(node.alternate, scope)
      return
    case 'text':
    case 'expression':
    case 'slot':
      return
    default:
      return assertNever(node)
  }
}

/** Walk a single node's JSX prop children (for `component` nodes only). */
function descendComponentJsxChildren<Scope>(
  node: IRComponent,
  scope: Scope,
  walk: (n: IRNode, s: Scope) => void,
): void {
  for (const prop of node.props) {
    if (!prop.jsxChildren) continue
    for (const child of prop.jsxChildren) walk(child, scope)
  }
}

/**
 * Walk an IR tree rooted at `root`, dispatching each node to the matching
 * visitor callback. If a callback is missing for a kind, the walker
 * descends into that kind's default children with the same scope.
 *
 * Callbacks control their own descent via `ctx.descend()` / `ctx.walk()`
 * and (for components) `ctx.descendJsxChildren()`.
 */
export function walkIR<Scope>(
  root: IRNode,
  initialScope: Scope,
  visitor: IRVisitor<Scope>,
): void {
  function walk(node: IRNode, scope: Scope): void {
    const doDescend = (nextScope: Scope = scope) => descendDefault(node, nextScope, walk)

    switch (node.type) {
      case 'element': {
        if (visitor.element) {
          visitor.element({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      case 'text': {
        if (visitor.text) {
          visitor.text({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        }
        return
      }
      case 'expression': {
        if (visitor.expression) {
          visitor.expression({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        }
        return
      }
      case 'conditional': {
        if (visitor.conditional) {
          visitor.conditional({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      case 'loop': {
        if (visitor.loop) {
          visitor.loop({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      case 'component': {
        if (visitor.component) {
          visitor.component({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            descendJsxChildren: (s = scope) => descendComponentJsxChildren(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      case 'slot': {
        if (visitor.slot) {
          visitor.slot({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        }
        return
      }
      case 'fragment': {
        if (visitor.fragment) {
          visitor.fragment({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      case 'if-statement': {
        if (visitor.ifStatement) {
          visitor.ifStatement({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      case 'provider': {
        if (visitor.provider) {
          visitor.provider({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      case 'async': {
        if (visitor.async) {
          visitor.async({
            node,
            scope,
            descend: (s = scope) => descendDefault(node, s, walk),
            walk: (n, s = scope) => walk(n, s),
          })
        } else {
          doDescend()
        }
        return
      }
      default:
        return assertNever(node)
    }
  }

  walk(root, initialScope)
}

function assertNever(x: never): never {
  throw new Error(`IRWalker: unhandled IRNode kind: ${JSON.stringify(x)}`)
}
