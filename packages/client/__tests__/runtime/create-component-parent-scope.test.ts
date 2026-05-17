/**
 * Regression test for #1320: `createComponent` must thread its
 * `slot.parent` scope through `_parentScopeId` so any hoisted-children
 * placeholder (`bf-s="__BF_PARENT_SCOPE__"`) the template body emits
 * resolves to the calling site's scope.
 *
 * Pre-fix, `createComponent` called `templateFn(unwrappedProps)`
 * without touching `_parentScopeId`, so a component rendered via the
 * dynamic-instance path (loop bodies, conditional branches, manual
 * `createComponent` calls) lost its hoisted child's `bf-s` — the
 * substitution-or-strip logic in `renderChild` stripped the
 * placeholder on the null-parent branch, and the inner span landed
 * in the DOM with no scope marker. This test pins the contract that
 * `slot.parent`'s scope reaches `_parentScopeId` for the duration of
 * the inner template eval.
 */

import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('createComponent + hoisted-children scope (#1320)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('substitutes __BF_PARENT_SCOPE__ with slot.parent for a child rendered via createComponent', async () => {
    const { hydrate, createComponent, renderChild } = await import('../../src/runtime')

    // Box renders its children inline. Its template references
    // `_p.children` verbatim — the children string is built by the
    // outer `renderChild` call before reaching Box.
    hydrate('Box_test1320', {
      init: () => {},
      template: (p: any) => `<div>${p.children}</div>`,
    })

    // Outer carries `<Box children={<span/>} />`. The compiler emits
    // the hoisted `<span>` with the placeholder; `renderChild('Box')`
    // substitutes it with the current `_parentScopeId` (the outer's
    // own scope), so the rendered span ends up with the outer's
    // bf-s value.
    hydrate('Outer_test1320', {
      init: () => {},
      template: () =>
        `${renderChild('Box_test1320', { children: '<span bf-s="__BF_PARENT_SCOPE__">x</span>' }, undefined, 's0')}`,
      comment: true,
    })

    // Mount via `createComponent` with a slot.parent — this is the
    // path #1320 broke. Pre-fix, the template's renderChild call saw
    // `_parentScopeId === null` and stripped the placeholder; after
    // the fix, `slot.parent` propagates into `_parentScopeId` for the
    // duration of the template eval and the substitution succeeds.
    const parentScopeId = 'OuterParent_abc123'
    const el = createComponent(
      'Outer_test1320',
      {},
      undefined,
      { parent: parentScopeId, mount: 's0' },
    )
    document.body.appendChild(el)

    const span = el.querySelector('span')
    expect(span).not.toBeNull()
    // Before the fix: `span.getAttribute('bf-s')` was `null` (placeholder
    // stripped). After the fix: it carries the outer parent scope ID.
    expect(span!.getAttribute('bf-s')).toBe(parentScopeId)
  })

  test('strips the placeholder when no slot.parent is provided (top-level mount)', async () => {
    const { hydrate, createComponent, renderChild } = await import('../../src/runtime')

    hydrate('TopBox_test1320', {
      init: () => {},
      template: (p: any) => `<div>${p.children}</div>`,
    })

    hydrate('TopOuter_test1320', {
      init: () => {},
      template: () =>
        `${renderChild('TopBox_test1320', { children: '<span bf-s="__BF_PARENT_SCOPE__">x</span>' }, undefined, 's0')}`,
      comment: true,
    })

    // No slot — top-level / standalone mount. No outer scope exists,
    // so the placeholder strips and the span renders without a
    // `bf-s`. (The alternative — emitting `bf-s=""` — produces an
    // empty attribute the hydration runtime treats as a malformed
    // scope, worse than no attribute at all.)
    const el = createComponent('TopOuter_test1320', {})
    document.body.appendChild(el)

    const span = el.querySelector('span')
    expect(span).not.toBeNull()
    expect(span!.hasAttribute('bf-s')).toBe(false)
  })

  test('restores _parentScopeId after the template call (re-entrant safety)', async () => {
    const { hydrate, createComponent, renderChild } = await import('../../src/runtime')

    hydrate('InnerLeaf_test1320', {
      init: () => {},
      template: (p: any) => `<div>${p.children}</div>`,
    })

    hydrate('OuterTwo_test1320', {
      init: () => {},
      template: () =>
        `${renderChild('InnerLeaf_test1320', { children: '<span data-pos="x" bf-s="__BF_PARENT_SCOPE__">x</span>' }, undefined, 's0')}`,
    })

    // First mount: creates a fresh element with slot.parent set so the
    // placeholder substitutes to `parentScopeId`. This call sets
    // `_parentScopeId` for the duration of the inner template eval —
    // the assertion below catches the substitution working.
    const parentScopeId = 'OuterTwo_xyz789'
    const elWithParent = createComponent(
      'OuterTwo_test1320',
      {},
      undefined,
      { parent: parentScopeId, mount: 's0' },
    )
    const innerWithParent = elWithParent.querySelector('span')
    expect(innerWithParent!.getAttribute('bf-s')).toBe(parentScopeId)

    // Immediately after, mount a second instance WITHOUT slot.parent.
    // If the first call had leaked `_parentScopeId` (no finally
    // restore), this template eval would inherit `parentScopeId` and
    // the placeholder would substitute. The restore makes
    // `_parentScopeId` null at this point, so the placeholder strips.
    const elWithoutParent = createComponent('OuterTwo_test1320', {})
    const innerWithoutParent = elWithoutParent.querySelector('span')
    expect(innerWithoutParent!.hasAttribute('bf-s')).toBe(false)
  })

  test('restores _parentScopeId even when the template throws', async () => {
    const { hydrate, createComponent, renderChild } = await import('../../src/runtime')

    hydrate('ThrowingChild_test1320', {
      init: () => {},
      template: () => { throw new Error('boom') },
    })

    hydrate('PassThroughLeaf_test1320', {
      init: () => {},
      template: (p: any) => `<div>${p.children}</div>`,
    })

    hydrate('PassThroughOuter_test1320', {
      init: () => {},
      template: () =>
        `${renderChild('PassThroughLeaf_test1320', { children: '<span bf-s="__BF_PARENT_SCOPE__">y</span>' }, undefined, 's0')}`,
    })

    hydrate('Thrower_test1320', {
      init: () => {},
      template: () => `${renderChild('ThrowingChild_test1320', {}, undefined, 's0')}`,
    })

    // First call throws inside the template. The `finally` in
    // createComponent must restore `_parentScopeId` regardless.
    expect(() =>
      createComponent(
        'Thrower_test1320',
        {},
        undefined,
        { parent: 'LeakedScope_abc', mount: 's0' },
      ),
    ).toThrow(/boom/)

    // Second call: no slot.parent. If the throw had short-circuited the
    // restore, this template would inherit `LeakedScope_abc` and the
    // placeholder would substitute. With the finally in place,
    // `_parentScopeId` is null and the placeholder strips.
    const el = createComponent('PassThroughOuter_test1320', {})
    const inner = el.querySelector('span')
    expect(inner!.hasAttribute('bf-s')).toBe(false)
  })
})
