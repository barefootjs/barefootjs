import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'fs'
import path from 'path'
import os from 'os'
import {
  parseStudioUrl,
  applyCssOverrides,
  applyTokenOverrides,
  resolveTokensCss,
  type StudioConfig,
} from '../commands/tokens-apply'

// ── parseStudioUrl ──

describe('parseStudioUrl', () => {
  test('extracts and decodes ?c= param', () => {
    const config: StudioConfig = { style: 'Sharp', radius: '0' }
    const encoded = encodeURIComponent(btoa(JSON.stringify(config)))
    const url = `https://ui.barefootjs.dev/studio?c=${encoded}`
    expect(parseStudioUrl(url)).toEqual(config)
  })

  test('returns undefined when no ?c= param', () => {
    expect(parseStudioUrl('https://ui.barefootjs.dev/studio')).toBeUndefined()
  })

  test('returns undefined for malformed Base64', () => {
    expect(parseStudioUrl('https://ui.barefootjs.dev/studio?c=!!!invalid!!!')).toBeUndefined()
  })

  test('returns undefined for invalid URL', () => {
    expect(parseStudioUrl('not-a-url')).toBeUndefined()
  })
})

// ── applyCssOverrides (the primary path — direct CSS patching) ──

const TOKENS_CSS_FIXTURE = `:root {
  --font-sans: -apple-system, sans-serif;
  --spacing: 0.25rem;
  --radius: 0.625rem;
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.dark {
  --primary: oklch(0.35 0 0);
  --secondary: oklch(0.269 0 0);
}
`

describe('applyCssOverrides', () => {
  let tmpDir: string
  let cssPath: string

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `bf-studio-css-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
    cssPath = path.join(tmpDir, 'tokens.css')
    writeFileSync(cssPath, TOKENS_CSS_FIXTURE)
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  function read(): string {
    return readFileSync(cssPath, 'utf-8')
  }

  test('rewrites --spacing in :root', () => {
    applyCssOverrides(cssPath, { spacing: '0.3rem' })
    expect(read()).toContain('--spacing: 0.3rem;')
    expect(read()).not.toContain('--spacing: 0.25rem;')
  })

  test('rewrites --radius in :root', () => {
    applyCssOverrides(cssPath, { radius: '0' })
    expect(read()).toContain('--radius: 0;')
    expect(read()).not.toContain('--radius: 0.625rem;')
  })

  test('rewrites --font-sans via font key mapping', () => {
    applyCssOverrides(cssPath, { font: 'inter' })
    expect(read()).toContain('--font-sans: "Inter", sans-serif;')
  })

  test('passes through unknown font keys verbatim', () => {
    applyCssOverrides(cssPath, { font: '"Custom Font", monospace' })
    expect(read()).toContain('--font-sans: "Custom Font", monospace;')
  })

  test('writes color light value to :root and dark value to .dark', () => {
    applyCssOverrides(cssPath, {
      tokens: {
        primary: { light: 'oklch(0.5 0.2 240)', dark: 'oklch(0.7 0.15 240)' },
      },
    })
    const css = read()
    // :root block keeps the light value
    const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('.dark'))
    expect(rootBlock).toContain('--primary: oklch(0.5 0.2 240);')
    // .dark block keeps the dark value
    const darkBlock = css.slice(css.indexOf('.dark'))
    expect(darkBlock).toContain('--primary: oklch(0.7 0.15 240);')
  })

  test('only writes light value when dark is absent', () => {
    applyCssOverrides(cssPath, {
      tokens: { secondary: { light: 'oklch(0.5 0 0)' } },
    })
    const css = read()
    // :root updated, .dark untouched
    expect(css.slice(css.indexOf(':root'), css.indexOf('.dark'))).toContain('--secondary: oklch(0.5 0 0);')
    expect(css.slice(css.indexOf('.dark'))).toContain('--secondary: oklch(0.269 0 0);')
  })

  test('appends a new color into .dark when no existing declaration', () => {
    // .dark does NOT have --radius. Adding it should append under the
    // Studio overrides comment so re-applies stay idempotent.
    applyCssOverrides(cssPath, {
      tokens: { background: { dark: 'oklch(0.1 0 0)' } },
    })
    const css = read()
    const darkBlock = css.slice(css.indexOf('.dark'))
    expect(darkBlock).toContain('Studio overrides')
    expect(darkBlock).toContain('--background: oklch(0.1 0 0);')
  })

  test('Sharp shadow preset rewrites all four shadow vars', () => {
    applyCssOverrides(cssPath, { style: 'Sharp' })
    const css = read()
    expect(css).toContain('--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.04);')
    expect(css).toContain('--shadow: 0 1px 2px 0 rgb(0 0 0 / 0.06);')
    expect(css).toContain('--shadow-md: 0 2px 4px -1px rgb(0 0 0 / 0.08);')
    expect(css).toContain('--shadow-lg: 0 4px 8px -2px rgb(0 0 0 / 0.1);')
  })

  test('unknown style names leave the CSS untouched', () => {
    applyCssOverrides(cssPath, { style: 'Unknown' })
    expect(read()).toBe(TOKENS_CSS_FIXTURE)
  })

  test('is idempotent: applying the same config twice yields the same file', () => {
    const config: StudioConfig = {
      spacing: '0.3rem',
      radius: '1rem',
      font: 'figtree',
      tokens: { primary: { light: 'oklch(0.5 0.2 240)', dark: 'oklch(0.7 0.15 240)' } },
      style: 'Soft',
    }
    applyCssOverrides(cssPath, config)
    const once = read()
    applyCssOverrides(cssPath, config)
    expect(read()).toBe(once)
  })

  test('rewrites in place when applying different configs sequentially', () => {
    applyCssOverrides(cssPath, { spacing: '0.3rem' })
    applyCssOverrides(cssPath, { spacing: '0.5rem' })
    const css = read()
    expect(css).toContain('--spacing: 0.5rem;')
    expect(css).not.toContain('--spacing: 0.3rem;')
  })
})

// ── resolveTokensCss ──

describe('resolveTokensCss', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `bf-studio-resolve-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  test('finds tokens.css under <paths.tokens>/', () => {
    mkdirSync(path.join(tmpDir, 'tokens'), { recursive: true })
    const target = path.join(tmpDir, 'tokens', 'tokens.css')
    writeFileSync(target, ':root {}')
    expect(resolveTokensCss(tmpDir, 'tokens')).toBe(target)
  })

  test('falls back to public/tokens.css (default adapter scaffold)', () => {
    mkdirSync(path.join(tmpDir, 'public'), { recursive: true })
    const target = path.join(tmpDir, 'public', 'tokens.css')
    writeFileSync(target, ':root {}')
    expect(resolveTokensCss(tmpDir, 'tokens')).toBe(target)
  })

  test('falls back to static/tokens.css', () => {
    mkdirSync(path.join(tmpDir, 'static'), { recursive: true })
    const target = path.join(tmpDir, 'static', 'tokens.css')
    writeFileSync(target, ':root {}')
    expect(resolveTokensCss(tmpDir, 'tokens')).toBe(target)
  })

  test('returns undefined when nothing matches', () => {
    expect(resolveTokensCss(tmpDir, 'tokens')).toBeUndefined()
  })

  test('prefers <paths.tokens>/ over public/ when both exist', () => {
    mkdirSync(path.join(tmpDir, 'tokens'), { recursive: true })
    mkdirSync(path.join(tmpDir, 'public'), { recursive: true })
    const primary = path.join(tmpDir, 'tokens', 'tokens.css')
    writeFileSync(primary, ':root {}')
    writeFileSync(path.join(tmpDir, 'public', 'tokens.css'), ':root {}')
    expect(resolveTokensCss(tmpDir, 'tokens')).toBe(primary)
  })
})

// ── applyTokenOverrides (tokens.json — monorepo path, best-effort) ──

describe('applyTokenOverrides', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `bf-studio-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  function writeTokens(data: any): string {
    const p = path.join(tmpDir, 'tokens.json')
    writeFileSync(p, JSON.stringify(data, null, 2))
    return p
  }

  function readTokens(p: string): any {
    return JSON.parse(readFileSync(p, 'utf-8'))
  }

  test('applies color overrides to colors array (bare names)', () => {
    const tokensPath = writeTokens({
      colors: [
        { name: 'primary', value: 'oklch(0.205 0 0)', dark: 'oklch(0.35 0 0)' },
        { name: 'secondary', value: 'oklch(0.97 0 0)', dark: 'oklch(0.269 0 0)' },
      ],
    })

    applyTokenOverrides(tokensPath, {
      tokens: {
        primary: { light: 'oklch(0.5 0.2 240)', dark: 'oklch(0.7 0.15 240)' },
      },
    })

    const result = readTokens(tokensPath)
    expect(result.colors[0].value).toBe('oklch(0.5 0.2 240)')
    expect(result.colors[0].dark).toBe('oklch(0.7 0.15 240)')
    expect(result.colors[1].value).toBe('oklch(0.97 0 0)')
  })

  test('applies spacing override', () => {
    const tokensPath = writeTokens({
      spacing: [{ name: 'spacing', value: '0.25rem' }],
    })

    applyTokenOverrides(tokensPath, { spacing: '0.3rem' })

    expect(readTokens(tokensPath).spacing[0].value).toBe('0.3rem')
  })

  test('applies radius override', () => {
    const tokensPath = writeTokens({
      borderRadius: [{ name: 'radius', value: '0.625rem' }],
    })

    applyTokenOverrides(tokensPath, { radius: '0' })

    expect(readTokens(tokensPath).borderRadius[0].value).toBe('0')
  })

  test('applies font override with key mapping', () => {
    const tokensPath = writeTokens({
      typography: {
        fontFamily: [{ name: 'font-sans', value: '-apple-system, sans-serif' }],
      },
    })

    applyTokenOverrides(tokensPath, { font: 'inter' })

    expect(readTokens(tokensPath).typography.fontFamily[0].value).toBe('"Inter", sans-serif')
  })

  test('applies shadow presets for Sharp style', () => {
    const tokensPath = writeTokens({
      shadows: [
        { name: 'shadow-sm', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)' },
        { name: 'shadow', value: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
        { name: 'shadow-md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
        { name: 'shadow-lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1)' },
      ],
    })

    applyTokenOverrides(tokensPath, { style: 'Sharp' })

    const result = readTokens(tokensPath)
    expect(result.shadows[0].value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.04)')
    expect(result.shadows[1].value).toBe('0 1px 2px 0 rgb(0 0 0 / 0.06)')
  })

  test('ignores unknown style names', () => {
    const tokensPath = writeTokens({
      shadows: [{ name: 'shadow-sm', value: 'original' }],
    })

    applyTokenOverrides(tokensPath, { style: 'Unknown' })

    expect(readTokens(tokensPath).shadows[0].value).toBe('original')
  })
})

// ── Round-trip ──

describe('round-trip encoding', () => {
  test('encode → URL → decode produces same config', () => {
    const original: StudioConfig = {
      style: 'Soft',
      tokens: {
        primary: { light: 'oklch(0.5 0.2 240)' },
        destructive: { light: 'oklch(0.6 0.3 30)', dark: 'oklch(0.7 0.2 30)' },
      },
      spacing: '0.3rem',
      radius: '1rem',
      font: 'figtree',
    }

    const encoded = encodeURIComponent(btoa(JSON.stringify(original)))
    const url = `https://ui.barefootjs.dev/studio?c=${encoded}`
    expect(parseStudioUrl(url)).toEqual(original)
  })
})
