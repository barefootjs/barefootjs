import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { render } from '../src/render'
import { createComponent } from '../src/component'
import { registerComponent } from '../src/registry'
import { registerTemplate } from '../src/template'
import { hydratedScopes } from '../src/hydration-state'
import type { ComponentDef } from '../src/types'
import type { InitFn } from '../src/types'
import type { TemplateFn } from '../src/template'
import { GlobalRegistrator } from '@happy-dom/global-registrator'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

function registerTestComponent(name: string, init: InitFn, template: TemplateFn): void {
  registerComponent(name, init)
  registerTemplate(name, template)
}

describe('render', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('renders component into container', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const initialized: Element[] = []
    registerTestComponent(
      'RenderTest_Basic',
      (scope) => { initialized.push(scope) },
      (props) => `<div class="counter">${props.count ?? 0}</div>`
    )

    render(container, 'RenderTest_Basic', { count: 42 })

    expect(container.children.length).toBe(1)
    expect(container.firstElementChild?.textContent).toBe('42')
    expect(container.firstElementChild?.className).toBe('counter')
    expect(initialized.length).toBe(1)
  })

  test('clears existing content', () => {
    const container = document.createElement('div')
    container.innerHTML = '<p>old content</p>'
    document.body.appendChild(container)

    registerTestComponent(
      'RenderTest_Clear',
      () => {},
      () => `<div>new content</div>`
    )

    render(container, 'RenderTest_Clear')

    expect(container.children.length).toBe(1)
    expect(container.firstElementChild?.textContent).toBe('new content')
  })

  test('sets bf-s scope attribute', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    registerTestComponent(
      'RenderTest_Scope',
      () => {},
      () => `<div>content</div>`
    )

    render(container, 'RenderTest_Scope')

    expect(container.firstElementChild?.hasAttribute('bf-s')).toBe(true)
  })

  test('throws when component is not registered', () => {
    const container = document.createElement('div')

    expect(() => render(container, 'RenderTest_NotRegistered')).toThrow('not registered')
  })

  test('passes props to init', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    const receivedProps: Record<string, unknown>[] = []
    registerTestComponent(
      'RenderTest_Props',
      (_scope, props) => { receivedProps.push(props) },
      () => `<div>content</div>`
    )

    render(container, 'RenderTest_Props', { foo: 'bar' })

    expect(receivedProps.length).toBe(1)
    expect(receivedProps[0]).toEqual({ foo: 'bar' })
  })

  test('marks element in hydratedScopes after init', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    registerTestComponent(
      'RenderTest_Hydrated',
      () => {},
      () => `<div>content</div>`
    )

    render(container, 'RenderTest_Hydrated')

    const element = container.firstElementChild!
    expect(hydratedScopes.has(element)).toBe(true)
  })
})

describe('createComponent with ComponentDef', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  test('creates element from ComponentDef', () => {
    const initialized: Element[] = []
    const def: ComponentDef = {
      init: (scope) => { initialized.push(scope) },
      template: (props) => `<li>${props.text}</li>`
    }

    const el = createComponent(def, { text: 'hello' })

    expect(el.tagName.toLowerCase()).toBe('li')
    expect(el.textContent).toBe('hello')
    expect(el.hasAttribute('bf-s')).toBe(true)
    expect(initialized.length).toBe(1)
  })

  test('sets data-key when provided', () => {
    const def: ComponentDef = {
      init: () => {},
      template: () => `<li>item</li>`
    }

    const el = createComponent(def, {}, 'key-1')

    expect(el.getAttribute('data-key')).toBe('key-1')
  })
})
