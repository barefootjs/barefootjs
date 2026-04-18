/**
 * Props Destructuring Warning Tests
 *
 * Tests for BF043: Props destructuring in function parameters breaks reactivity.
 * BF043 is only emitted for stateful components (with signals/memos/effects).
 * Stateless components can safely destructure props.
 */

import { describe, test, expect } from 'bun:test'
import { analyzeComponent } from '../analyzer'
import { ErrorCodes } from '../errors'

describe('Props Destructuring Warning (BF043)', () => {
  test('warns on destructured props in stateful component', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        checked: boolean
      }

      export function Component({ checked }: Props) {
        const [count, setCount] = createSignal(0)
        return <div>{checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
    expect(propsWarnings[0].severity).toBe('warning')
    expect(propsWarnings[0].suggestion?.message).toContain('props object')
  })

  test('no warning on destructured props in stateless component', () => {
    const source = `
      interface Props {
        checked: boolean
      }

      export function Component({ checked }: Props) {
        return <div>{checked}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('warns on rest props in stateful component', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        checked: boolean
      }

      export function Component({ ...props }: Props) {
        const [count, setCount] = createSignal(0)
        return <div>{props.checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('warns on partial destructuring with rest props in stateful component', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        onClick: () => void
        checked: boolean
      }

      export function Component({ onClick, ...rest }: Props) {
        const [count, setCount] = createSignal(0)
        return <div onClick={onClick}>{rest.checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('no warning with @bf-ignore props-destructuring', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        checked: boolean
      }

      // @bf-ignore props-destructuring
      export function Component({ checked }: Props) {
        const [count, setCount] = createSignal(0)
        return <div>{checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('no warning when props object is used', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        checked: boolean
      }

      export function Component(props: Props) {
        const [count, setCount] = createSignal(0)
        return <div>{props.checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('no warning when no props parameter', () => {
    const source = `
      'use client'

      export function Component() {
        return <div>Hello</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('warns on arrow function component with destructuring when stateful', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        checked: boolean
      }

      export const Component = ({ checked }: Props) => {
        const [count, setCount] = createSignal(0)
        return <div>{checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('no warning on arrow function with @bf-ignore', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        checked: boolean
      }

      // @bf-ignore props-destructuring
      export const Component = ({ checked }: Props) => {
        const [count, setCount] = createSignal(0)
        return <div>{checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })

  test('warns on multiple destructured props in stateful component', () => {
    const source = `
      'use client'
      import { createSignal } from '@barefootjs/client'

      interface Props {
        checked: boolean
        onChange: () => void
        label: string
      }

      export function Component({ checked, onChange, label }: Props) {
        const [count, setCount] = createSignal(0)
        return <div onClick={onChange}>{label}: {checked}{count()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1) // One warning per component, not per prop
  })

  test('warns when component has memos (stateful)', () => {
    const source = `
      'use client'
      import { createMemo } from '@barefootjs/client'

      interface Props {
        value: number
      }

      export function Component({ value }: Props) {
        const doubled = createMemo(() => value * 2)
        return <div>{doubled()}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('warns when component has effects (stateful)', () => {
    const source = `
      'use client'
      import { createEffect } from '@barefootjs/client'

      interface Props {
        value: number
      }

      export function Component({ value }: Props) {
        createEffect(() => console.log(value))
        return <div>{value}</div>
      }
    `

    const ctx = analyzeComponent(source, 'Component.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(1)
  })

  test('no warning on stateless arrow function with destructuring', () => {
    const source = `
      interface Props {
        className: string
        variant: string
      }

      export const Button = ({ className, variant }: Props) => {
        return <button className={className}>{variant}</button>
      }
    `

    const ctx = analyzeComponent(source, 'Button.tsx')

    const propsWarnings = ctx.errors.filter((e) => e.code === ErrorCodes.PROPS_DESTRUCTURING)
    expect(propsWarnings).toHaveLength(0)
  })
})
