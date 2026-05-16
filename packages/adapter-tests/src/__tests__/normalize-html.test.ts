import { describe, test, expect } from 'bun:test'
import { normalizeHTML } from '../jsx-runner'

describe('normalizeHTML — async placeholder strip', () => {
  test('removes a flat <div bf-async> placeholder, keeping the resolved siblings', () => {
    const html = '<div><div bf-async="a0"><p>Loading...</p></div><span>Resolved</span></div>'
    expect(normalizeHTML(html)).toBe('<div><span>Resolved</span></div>')
  })

  test('removes a placeholder whose fallback contains nested <div> without dangling </div>', () => {
    const html = '<div><div bf-async="a0"><div class="skeleton"><div>Loading...</div></div></div><span>Resolved</span></div>'
    expect(normalizeHTML(html)).toBe('<div><span>Resolved</span></div>')
  })

  test('strips multiple sibling placeholders in one pass', () => {
    const html = '<main><div bf-async="a0"><p>A</p></div><div bf-async="a1"><p>B</p></div><section>Done</section></main>'
    expect(normalizeHTML(html)).toBe('<main><section>Done</section></main>')
  })

  test('leaves unrelated <div> elements untouched', () => {
    const html = '<div class="root"><div bf-async="a0"><p>L</p></div><div class="card">Card</div></div>'
    expect(normalizeHTML(html)).toBe('<div class="root"><div class="card">Card</div></div>')
  })

  test('placeholder containing a void <br/> in its fallback closes correctly', () => {
    const html = '<div bf-async="a0">Wait<br/>just a moment</div><span>Done</span>'
    expect(normalizeHTML(html)).toBe('<span>Done</span>')
  })
})
