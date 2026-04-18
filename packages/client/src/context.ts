/**
 * Context API: pure metadata portion.
 *
 * `createContext` is DOM-free and safe to use anywhere (including SSR).
 * The DOM-bound operations (`useContext`, `provideContext`) live in
 * `./runtime/context.ts` and are emitted by the compiler for `'use client'`
 * components.
 */

export type Context<T> = {
  readonly id: symbol
  readonly defaultValue: T | undefined
  /** Internal flag: true when default was explicitly provided (even if undefined) */
  readonly _hasDefault: boolean
  /** JSX Provider component. Compiled to provideContext() by the compiler. */
  readonly Provider: (props: { value: T; children?: unknown }) => unknown
}

/**
 * Create a new context with an optional default value.
 *
 * When no default is provided, useContext() will throw if no provider is found.
 * When a default is provided (even if `undefined`), useContext() returns that default.
 */
export function createContext<T>(defaultValue?: T): Context<T> {
  return {
    id: Symbol(),
    defaultValue,
    _hasDefault: arguments.length > 0,
    // Provider is compiled away by the JSX compiler into provideContext() calls.
    // This runtime stub exists only for TypeScript type checking.
    Provider: (() => {
      throw new Error('Context.Provider should be compiled away')
    }) as Context<T>['Provider'],
  }
}
