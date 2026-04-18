/**
 * createPortal Test
 *
 * Tests for client-side portal utility.
 * API inspired by React's createPortal(children, domNode).
 */

import { describe, test, expect, beforeAll, beforeEach } from 'bun:test'
import { GlobalRegistrator } from '@happy-dom/global-registrator'
import { createPortal } from '../../src/runtime/portal'

beforeAll(() => {
  if (typeof window === 'undefined') {
    GlobalRegistrator.register()
  }
})

describe('createPortal', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  describe('with HTML string', () => {
    test('mounts HTML to custom container', () => {
      const portal = createPortal('<div class="modal">Hello</div>', container)

      expect(container.children.length).toBe(1)
      expect(container.children[0]).toBe(portal.element)
      expect(portal.element.className).toBe('modal')
      expect(portal.element.textContent).toBe('Hello')
    })

    test('mounts HTML to document.body by default', () => {
      const initialBodyChildren = document.body.children.length
      const portal = createPortal('<div class="modal">Default Body</div>')

      expect(document.body.children.length).toBe(initialBodyChildren + 1)
      expect(portal.element.className).toBe('modal')
      expect(portal.element.textContent).toBe('Default Body')

      // Cleanup
      portal.unmount()
    })

    test('throws error for empty HTML', () => {
      expect(() => createPortal('', container)).toThrow('createPortal: Invalid HTML provided')
    })

    test('throws error for whitespace-only HTML', () => {
      expect(() => createPortal('   \n\t  ', container)).toThrow('createPortal: Invalid HTML provided')
    })

    test('mounts complex nested HTML', () => {
      const portal = createPortal(`
        <div class="modal-overlay">
          <div class="modal" role="dialog" aria-modal="true">
            <h2>Title</h2>
            <p>Content</p>
            <button>Close</button>
          </div>
        </div>
      `, container)

      expect(portal.element.className).toBe('modal-overlay')
      expect(portal.element.querySelector('.modal')).not.toBeNull()
      expect(portal.element.querySelector('h2')?.textContent).toBe('Title')
      expect(portal.element.querySelector('p')?.textContent).toBe('Content')
      expect(portal.element.querySelector('button')?.textContent).toBe('Close')
    })
  })

  describe('with HTMLElement', () => {
    test('mounts HTMLElement to container', () => {
      const modalEl = document.createElement('div')
      modalEl.className = 'modal'
      modalEl.textContent = 'Hello from element'

      const portal = createPortal(modalEl, container)

      expect(container.children.length).toBe(1)
      expect(container.children[0]).toBe(portal.element)
      expect(portal.element).toBe(modalEl)
      expect(portal.element.className).toBe('modal')
      expect(portal.element.textContent).toBe('Hello from element')
    })

    test('mounts HTMLElement to document.body by default', () => {
      const initialBodyChildren = document.body.children.length
      const modalEl = document.createElement('div')
      modalEl.className = 'modal'

      const portal = createPortal(modalEl)

      expect(document.body.children.length).toBe(initialBodyChildren + 1)
      expect(portal.element).toBe(modalEl)

      // Cleanup
      portal.unmount()
    })

    test('mounts element with children', () => {
      const wrapper = document.createElement('div')
      wrapper.className = 'wrapper'

      const child1 = document.createElement('span')
      child1.textContent = 'Child 1'
      const child2 = document.createElement('span')
      child2.textContent = 'Child 2'

      wrapper.appendChild(child1)
      wrapper.appendChild(child2)

      const portal = createPortal(wrapper, container)

      expect(portal.element.children.length).toBe(2)
      expect(portal.element.children[0].textContent).toBe('Child 1')
      expect(portal.element.children[1].textContent).toBe('Child 2')
    })
  })

  describe('unmount', () => {
    test('removes the element from DOM', () => {
      const portal = createPortal('<div class="modal">To be removed</div>', container)
      expect(container.children.length).toBe(1)

      portal.unmount()
      expect(container.children.length).toBe(0)
    })

    test('is idempotent (safe to call multiple times)', () => {
      const portal = createPortal('<div>Content</div>', container)
      portal.unmount()
      portal.unmount()
      portal.unmount()

      expect(container.children.length).toBe(0)
    })

    test('works with HTMLElement', () => {
      const modalEl = document.createElement('div')
      const portal = createPortal(modalEl, container)

      expect(container.children.length).toBe(1)
      portal.unmount()
      expect(container.children.length).toBe(0)
    })
  })

  describe('multiple portals', () => {
    test('work independently', () => {
      const container1 = document.createElement('div')
      const container2 = document.createElement('div')

      const portal1 = createPortal('<div>Portal 1</div>', container1)
      const portal2 = createPortal('<div>Portal 2</div>', container2)

      expect(container1.children.length).toBe(1)
      expect(container2.children.length).toBe(1)
      expect(portal1.element.textContent).toBe('Portal 1')
      expect(portal2.element.textContent).toBe('Portal 2')

      portal1.unmount()

      expect(container1.children.length).toBe(0)
      expect(container2.children.length).toBe(1)
    })

    test('can mount multiple elements to same container', () => {
      const portal1 = createPortal('<div>First</div>', container)
      const portal2 = createPortal('<div>Second</div>', container)

      expect(container.children.length).toBe(2)
      expect(container.children[0].textContent).toBe('First')
      expect(container.children[1].textContent).toBe('Second')

      portal1.unmount()
      expect(container.children.length).toBe(1)
      expect(container.children[0].textContent).toBe('Second')
    })
  })

  describe('element reference', () => {
    test('provides access to mounted element', () => {
      const portal = createPortal(
        '<div id="my-modal" class="modal active" data-testid="modal" aria-hidden="false"></div>',
        container
      )

      expect(portal.element.id).toBe('my-modal')
      expect(portal.element.className).toBe('modal active')
      expect(portal.element.dataset.testid).toBe('modal')
      expect(portal.element.getAttribute('aria-hidden')).toBe('false')
    })

    test('element can be modified after mount', () => {
      const portal = createPortal('<div class="modal"></div>', container)

      portal.element.classList.add('active')
      portal.element.textContent = 'Updated content'

      expect(container.children[0].classList.contains('active')).toBe(true)
      expect(container.children[0].textContent).toBe('Updated content')
    })
  })

  describe('with Renderable (JSX.Element)', () => {
    test('mounts object with toString() method', () => {
      // Simulates Hono's HtmlEscapedString / JSX.Element
      const jsxElement = {
        toString() {
          return '<div class="modal">From JSX</div>'
        }
      }

      const portal = createPortal(jsxElement, container)

      expect(container.children.length).toBe(1)
      expect(portal.element.className).toBe('modal')
      expect(portal.element.textContent).toBe('From JSX')
    })

    test('mounts complex JSX-like structure', () => {
      const jsxElement = {
        toString() {
          return `
            <div class="dialog" role="dialog">
              <h2>Dialog Title</h2>
              <p>Dialog content</p>
            </div>
          `
        }
      }

      const portal = createPortal(jsxElement, container)

      expect(portal.element.className).toBe('dialog')
      expect(portal.element.getAttribute('role')).toBe('dialog')
      expect(portal.element.querySelector('h2')?.textContent).toBe('Dialog Title')
    })

    test('throws error for Renderable returning empty HTML', () => {
      const emptyJsx = {
        toString() {
          return ''
        }
      }

      expect(() => createPortal(emptyJsx, container)).toThrow('createPortal: Invalid HTML provided')
    })
  })

  describe('with ownerScope option', () => {
    test('sets bf-po when ownerScope has scope ID', () => {
      const ownerScope = document.createElement('div')
      ownerScope.setAttribute('bf-s', 'Dialog_abc123')

      const portal = createPortal('<div class="modal">Content</div>', container, { ownerScope })

      expect(portal.element.getAttribute('bf-po')).toBe('Dialog_abc123')
    })

    test('does not set bf-po when ownerScope is missing scope ID', () => {
      const ownerScope = document.createElement('div')
      // No bf-s attribute

      const portal = createPortal('<div class="modal">Content</div>', container, { ownerScope })

      expect(portal.element.hasAttribute('bf-po')).toBe(false)
    })

    test('does not set bf-po when options not provided', () => {
      const portal = createPortal('<div class="modal">Content</div>', container)

      expect(portal.element.hasAttribute('bf-po')).toBe(false)
    })

    test('does not set bf-po when ownerScope is undefined', () => {
      const portal = createPortal('<div class="modal">Content</div>', container, { ownerScope: undefined })

      expect(portal.element.hasAttribute('bf-po')).toBe(false)
    })

    test('works with HTMLElement children', () => {
      const ownerScope = document.createElement('div')
      ownerScope.setAttribute('bf-s', 'DialogContent_xyz789')

      const modalEl = document.createElement('div')
      modalEl.className = 'dialog-content'

      const portal = createPortal(modalEl, container, { ownerScope })

      expect(portal.element.getAttribute('bf-po')).toBe('DialogContent_xyz789')
      expect(portal.element.className).toBe('dialog-content')
    })
  })
})
