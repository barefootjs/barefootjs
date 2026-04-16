import { describe, test, expect } from 'bun:test'
import {
  renderAsyncBoundary,
  renderAsyncResolve,
  streamingBootstrap,
  AsyncIdGenerator,
} from '../src/index'

describe('renderAsyncBoundary', () => {
  test('wraps fallback in div with bf-async attribute', () => {
    const html = renderAsyncBoundary('a0', '<p>Loading...</p>')
    expect(html).toBe('<div bf-async="a0"><p>Loading...</p></div>')
  })

  test('supports custom wrapper tag', () => {
    const html = renderAsyncBoundary('a1', '<span>Wait</span>', 'section')
    expect(html).toBe('<section bf-async="a1"><span>Wait</span></section>')
  })

  test('handles empty fallback', () => {
    const html = renderAsyncBoundary('a2', '')
    expect(html).toBe('<div bf-async="a2"></div>')
  })
})

describe('renderAsyncResolve', () => {
  test('generates template + swap script', () => {
    const html = renderAsyncResolve('a0', '<div>Resolved</div>')
    expect(html).toContain('<template bf-async-resolve="a0">')
    expect(html).toContain('<div>Resolved</div>')
    expect(html).toContain('</template>')
    expect(html).toContain('<script>__bf_swap("a0")</script>')
  })

  test('preserves hydration markers in content', () => {
    const content = '<div bf-s="Counter_x1" bf-p=\'{"n":0}\'>0</div>'
    const html = renderAsyncResolve('a0', content)
    expect(html).toContain('bf-s="Counter_x1"')
    expect(html).toContain('bf-p=')
  })
})

describe('streamingBootstrap', () => {
  test('returns a script tag', () => {
    const script = streamingBootstrap()
    expect(script).toStartWith('<script>')
    expect(script).toEndWith('</script>')
  })

  test('defines __bf_swap on window', () => {
    const script = streamingBootstrap()
    expect(script).toContain('__bf_swap')
    expect(script).toContain('window.__bf_swap')
  })

  test('references bf-async and bf-async-resolve attributes', () => {
    const script = streamingBootstrap()
    expect(script).toContain('bf-async')
    expect(script).toContain('bf-async-resolve')
  })

  test('calls __bf_hydrate in requestAnimationFrame', () => {
    const script = streamingBootstrap()
    expect(script).toContain('requestAnimationFrame')
    expect(script).toContain('__bf_hydrate')
  })
})

describe('AsyncIdGenerator', () => {
  test('generates sequential IDs', () => {
    const gen = new AsyncIdGenerator()
    expect(gen.next()).toBe('a0')
    expect(gen.next()).toBe('a1')
    expect(gen.next()).toBe('a2')
  })

  test('resets counter', () => {
    const gen = new AsyncIdGenerator()
    gen.next()
    gen.next()
    gen.reset()
    expect(gen.next()).toBe('a0')
  })

  test('independent instances', () => {
    const gen1 = new AsyncIdGenerator()
    const gen2 = new AsyncIdGenerator()
    expect(gen1.next()).toBe('a0')
    expect(gen2.next()).toBe('a0')
    expect(gen1.next()).toBe('a1')
    expect(gen2.next()).toBe('a1')
  })
})
