import { describe, test, expect } from 'bun:test'
import { addScriptCollection, createConfig, maskComments } from '../build'

// ── addScriptCollection ──────────────────────────────────────────────

describe('addScriptCollection', () => {
  test('injects imports and script collector into exported function', () => {
    const input = `import { jsx } from 'hono/jsx'

export function Counter(props: CounterProps) {
  return (<div>hello</div>)
}`

    const result = addScriptCollection(input, 'Counter', 'Counter.client.js')

    expect(result).toContain("import { useRequestContext } from 'hono/jsx-renderer'")
    expect(result).toContain("import { Fragment } from 'hono/jsx'")
    expect(result).toContain('__bfWrap')
    expect(result).toContain('bfCollectedScripts')
    expect(result).toContain("'Counter'")
    expect(result).toContain('Counter.client.js')
  })

  test('preserves content when no import match', () => {
    const input = 'const x = 1'
    // Should not throw, returns unchanged or minimally modified
    const result = addScriptCollection(input, 'Test', 'Test.client.js')
    expect(result).toBeDefined()
  })

  test('uses custom scriptBasePath', () => {
    const input = `import { jsx } from 'hono/jsx'

export function Counter() {
  return (<div>hello</div>)
}`

    const result = addScriptCollection(input, 'Counter', 'Counter.client.js', '/assets/js/')
    expect(result).toContain('/assets/js/barefoot.js')
    expect(result).toContain('/assets/js/Counter.client.js')
    expect(result).not.toContain('/static/components/')
  })

  test('normalizes scriptBasePath without trailing slash', () => {
    const input = `import { jsx } from 'hono/jsx'

export function Counter() {
  return (<div>hello</div>)
}`

    const result = addScriptCollection(input, 'Counter', 'Counter.client.js', '/assets/js')
    expect(result).toContain('/assets/js/barefoot.js')
    expect(result).toContain('/assets/js/Counter.client.js')
  })

  test('ignores `function PascalCase(` text inside JSDoc / inline comments (#1236)', () => {
    // A docstring example previously triggered a bogus insertion when
    // the function-pattern regex matched inside the comment, after
    // which the paren counter walked into the wrong `{` and corrupted
    // a real function further down.
    const input = `import { jsx } from 'hono/jsx'

export interface MyProps {
  /**
   * Example imperative signature for the docs:
   *   function MyNode(this: HTMLElement, props): void
   */
  nodeTypes?: Record<string, unknown>
}

// also: function FakeFromLineComment(this: any) {} should not match

export function Counter(props: MyProps) {
  return (<div>hello</div>)
}`

    const result = addScriptCollection(input, 'Counter', 'Counter.client.js')

    // The real Counter must be wrapped exactly once.
    const collectorCount = (result.match(/let __bfInlineScripts/g) || []).length
    expect(collectorCount).toBe(1)

    // And the collector must land inside Counter's body, immediately after
    // its opening brace — the same shape the destructured-params test
    // above verifies. If the comment matches had fired, the collector
    // would be misplaced inside the interface or the JSDoc.
    const counterBodyMatch = result.match(/function Counter\(props: MyProps\)\s*\{/)
    expect(counterBodyMatch).not.toBeNull()
    if (counterBodyMatch) {
      const after = result.slice(result.indexOf(counterBodyMatch[0]) + counterBodyMatch[0].length)
      expect(after.trimStart().startsWith('let __bfInlineScripts')).toBe(true)
    }
  })

  test('still finds function declarations after JSX text with apostrophes (#1236)', () => {
    // Defensive: an unbalanced `'` inside JSX text content (e.g.
    // `How's it going`) used to cause an over-aggressive string-mask
    // to blank everything until the next stray `'`, hiding later
    // function declarations from the regex. Keep apostrophe-containing
    // JSX text unmasked so subsequent functions still get instrumented.
    const input = `import { jsx } from 'hono/jsx'

export function Greeting() {
  return (<div>Hey! How's it going?</div>)
}

export function Footer() {
  return (<div>Bye</div>)
}`

    const result = addScriptCollection(input, 'page', 'page-abc.js')

    // BOTH functions must be wrapped.
    const collectorCount = (result.match(/let __bfInlineScripts/g) || []).length
    expect(collectorCount).toBe(2)
    expect(result).toMatch(/function Greeting\(\)\s*\{\s*\n?\s*let __bfInlineScripts/)
    expect(result).toMatch(/function Footer\(\)\s*\{\s*\n?\s*let __bfInlineScripts/)
  })

  test('handles destructured params with arrow function defaults', () => {
    const input = `import { jsx } from 'hono/jsx'

export function Textarea({ className = '', onInput = () => {}, onChange = () => {}, ...props }: TextareaProps) {
  return (<textarea class={className} {...props} />)
}`

    const result = addScriptCollection(input, 'textarea', 'textarea-abc123.js')

    // Script collector must be inside the Textarea function body, NOT inside a default param
    expect(result).toContain('__bfInlineScripts')
    expect(result).toContain('__bfWrap')

    // Verify __bfInlineScripts is declared AFTER the function opening brace,
    // not inside an arrow function default value
    const funcBodyMatch = result.match(/\.\.\.props\s*\}\s*:\s*TextareaProps\)\s*\{/)
    expect(funcBodyMatch).not.toBeNull()
    // After the function body opening, the next thing should be the script collector
    if (funcBodyMatch) {
      const afterFuncBody = result.slice(result.indexOf(funcBodyMatch[0]) + funcBodyMatch[0].length)
      expect(afterFuncBody.trimStart().startsWith('let __bfInlineScripts')).toBe(true)
    }
  })
})

// ── createConfig() factory ──────────────────────────────────────────

describe('createConfig()', () => {
  test('creates config with HonoAdapter', () => {
    const config = createConfig()
    expect(config.adapter.name).toBe('hono')
  })

  test('sets transformMarkedTemplate by default', () => {
    const config = createConfig()
    expect(typeof config.transformMarkedTemplate).toBe('function')
  })

  test('disables transformMarkedTemplate when scriptCollection is false', () => {
    const config = createConfig({ scriptCollection: false })
    expect(config.transformMarkedTemplate).toBeUndefined()
  })

  test('uses custom scriptBasePath in transformMarkedTemplate', () => {
    const config = createConfig({ scriptBasePath: '/assets/js/' })
    const input = `import { jsx } from 'hono/jsx'

export function Counter() {
  return (<div>hello</div>)
}`
    const result = config.transformMarkedTemplate!(input, 'Counter', 'Counter.client.js')
    expect(result).toContain('/assets/js/barefoot.js')
    expect(result).toContain('/assets/js/Counter.client.js')
    expect(result).not.toContain('/static/components/')
  })

  test('uses default scriptBasePath in transformMarkedTemplate', () => {
    const config = createConfig()
    const input = `import { jsx } from 'hono/jsx'

export function Counter() {
  return (<div>hello</div>)
}`
    const result = config.transformMarkedTemplate!(input, 'Counter', 'Counter.client.js')
    expect(result).toContain('/static/components/barefoot.js')
    expect(result).toContain('/static/components/Counter.client.js')
  })

  test('passes through build options', () => {
    const config = createConfig({
      components: ['src'],
      outDir: 'build',
      minify: true,
      contentHash: true,
    })
    expect(config.components).toEqual(['src'])
    expect(config.outDir).toBe('build')
    expect(config.minify).toBe(true)
    expect(config.contentHash).toBe(true)
  })

  test('passes through externals and externalsBasePath', () => {
    const externals = { react: { url: 'https://cdn.example.com/react.js' } }
    const config = createConfig({
      externals,
      externalsBasePath: '/cdn/',
    })
    expect(config.externals).toBe(externals)
    expect(config.externalsBasePath).toBe('/cdn/')
  })

  test('externals and externalsBasePath default to undefined', () => {
    const config = createConfig()
    expect(config.externals).toBeUndefined()
    expect(config.externalsBasePath).toBeUndefined()
  })

  test('passes through localImportPrefixes', () => {
    const config = createConfig({ localImportPrefixes: ['@/', '@ui/'] })
    expect(config.localImportPrefixes).toEqual(['@/', '@ui/'])
  })

  test('localImportPrefixes defaults to undefined', () => {
    const config = createConfig()
    expect(config.localImportPrefixes).toBeUndefined()
  })
})

// ── maskComments ────────────────────────────────────────────────────

describe('maskComments', () => {
  test('preserves length and newlines so indices stay valid in the original', () => {
    const src = '/* foo */ x // bar\ny\n/* multi\nline */ z'
    const masked = maskComments(src)
    expect(masked).toHaveLength(src.length)
    // Every newline position in the original is preserved in the masked
    // copy, so line counts (and therefore line:column error reporting
    // from downstream tools) line up.
    const newlinePositions = (s: string) => [...s].flatMap((c, i) => c === '\n' ? [i] : [])
    expect(newlinePositions(masked)).toEqual(newlinePositions(src))
  })

  test('blanks JSDoc / block comments including any quotes inside', () => {
    const comment = "/** has 'apostrophe' inside */"
    const tail = ' const x = 1'
    const src = comment + tail
    const masked = maskComments(src)
    // The whole `/** ... */` is replaced with spaces; the apostrophes
    // inside cannot re-open as strings later.
    expect(masked).toBe(' '.repeat(comment.length) + tail)
  })

  test('blanks `//` line comments up to (but not including) the newline', () => {
    const comment = '// ignored'
    const tail = '\nconst x = 1'
    const src = comment + tail
    const masked = maskComments(src)
    expect(masked).toBe(' '.repeat(comment.length) + tail)
  })

  test('handles unclosed block comment by masking through end of input', () => {
    const src = 'a /* never closed\nfunction Real() {}'
    const masked = maskComments(src)
    // Without `*/`, the masker blanks to EOF. `function Real()` is
    // hidden — this matches the JS lexer's behaviour for unterminated
    // comments and is the conservative thing to do for the
    // function-pattern regex.
    expect(masked.startsWith('a ')).toBe(true)
    expect(masked).not.toContain('function Real')
    expect(masked).toHaveLength(src.length)
  })

  test('leaves comment-free code untouched (no false positives on JSX text)', () => {
    // Plain code with no comment delimiters round-trips identically.
    // JSX text with apostrophes (`How's`) is the hot path: a
    // string-aware masker would treat the `'` as an open quote and
    // blank the rest of the file, hiding later function declarations
    // (#1236 follow-up).
    const src = `export function Greeting() {\n  return (<div>Hey! How's it going?</div>)\n}\nexport function Footer() {}`
    expect(maskComments(src)).toBe(src)
  })

  test('KNOWN LIMITATION: `//` inside a string is still treated as a line comment', () => {
    // Documented in `maskComments` jsdoc: this helper does not track
    // string boundaries, so a `//` appearing inside a string literal
    // is still treated as a comment delimiter. SSR template output
    // (the only current caller) does not produce such cases, so the
    // simpler implementation is acceptable. If a future caller can
    // produce them, swap in a real lexer — this test will start to
    // fail and force the conversation.
    const prefix = `const u = "https:`
    const blanked = `//example.com" ; const x = 1`
    const src = prefix + blanked
    const masked = maskComments(src)
    // The `//` in `https://` is treated as a line-comment delimiter
    // and the rest of the line gets blanked.
    expect(masked).toBe(prefix + ' '.repeat(blanked.length))
    expect(masked).toHaveLength(src.length)
  })
})
