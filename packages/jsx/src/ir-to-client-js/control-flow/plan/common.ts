/**
 * Plan-layer types shared across multiple Plan kinds.
 *
 * `ScopeRef` discriminates which scope variable to use in the runtime call
 * (top-level `__scope`, branch-scoped `__branchScope`, or a named loop element
 * variable like `__el`).
 */

/**
 * The scope variable to pass as the first argument of insert(...) /
 * mapArray(...). At top-level this is `__scope`; nested inside an arm body
 * it is `__branchScope`; nested inside a loop renderItem it is the loop
 * element variable (e.g. `__el`).
 */
export type ScopeRef =
  | { kind: 'top' }                         // emits `__scope`
  | { kind: 'branchScope' }                 // emits `__branchScope`
  | { kind: 'var'; name: string }           // emits the literal variable name
