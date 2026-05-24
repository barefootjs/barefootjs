import { describe, test, expect, spyOn, beforeEach, afterEach } from 'bun:test'
import { search, printSearchResults, mergeResults, type SearchResult } from '../commands/search'
import { loadIndex, fetchIndex, tryFetchIndex } from '../lib/meta-loader'
import { scanCoreDocs } from '../lib/docs-loader'
import type { MetaIndex } from '../lib/types'
import path from 'path'

const metaDir = path.resolve(import.meta.dir, '../../../../ui/meta')
const docsDir = path.resolve(import.meta.dir, '../../../../docs/core')

describe('search', () => {
  const index = loadIndex(metaDir)

  test('finds component by name', () => {
    const results = search('button', index, 'local')
    expect(results.some(r => r.name === 'button')).toBe(true)
  })

  test('tags results with the given source', () => {
    const local = search('button', index, 'local')
    expect(local.filter(r => r.type === 'component').every(r => r.source === 'local')).toBe(true)

    const reg = search('button', index, 'registry')
    expect(reg.filter(r => r.type === 'component').every(r => r.source === 'registry')).toBe(true)
  })

  test('finds component by category', () => {
    const results = search('input', index, 'local')
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(r =>
      r.name.includes('input') ||
      r.category.includes('input') ||
      r.description.toLowerCase().includes('input')
    )).toBe(true)
  })

  test('finds component by tag', () => {
    const results = search('button', index, 'local')
    expect(results.every(r =>
      r.name.includes('button') ||
      r.category.includes('button') ||
      r.description.toLowerCase().includes('button')
    )).toBe(true)
  })

  test('expands category aliases (form → input)', () => {
    const results = search('form', index, 'local')
    const hasInputCategory = results.some(r => r.category === 'input')
    expect(hasInputCategory).toBe(true)
  })

  test('returns empty array for no match', () => {
    const results = search('zzz_nonexistent_zzz', index, 'local')
    expect(results).toEqual([])
  })

  test('--dir override: searches in arbitrary directory', () => {
    const results = search('button', index, 'local')
    expect(results.some(r => r.name === 'button')).toBe(true)
  })

  test('exits with error on nonexistent directory', () => {
    const exitSpy = spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit') })
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => loadIndex('/nonexistent/path')).toThrow('exit')
      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      exitSpy.mockRestore()
      errorSpy.mockRestore()
    }
  })
})

describe('fetchIndex', () => {
  let exitSpy: ReturnType<typeof spyOn>
  let errorSpy: ReturnType<typeof spyOn>
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    exitSpy = spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit') })
    errorSpy = spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  const fakeIndex: MetaIndex = {
    version: 1,
    generatedAt: '2026-01-01',
    components: [{ name: 'button', title: 'Button', category: 'input', description: 'A button', tags: ['button'], stateful: false }],
  }

  test('fetches and parses remote index.json', async () => {
    globalThis.fetch = async (url: any) => {
      expect(String(url)).toBe('https://example.com/r/index.json')
      return new Response(JSON.stringify(fakeIndex), { status: 200 })
    }
    const result = await fetchIndex('https://example.com/r/')
    expect(result).toEqual(fakeIndex)
  })

  test('appends /index.json when URL has no trailing slash', async () => {
    globalThis.fetch = async (url: any) => {
      expect(String(url)).toBe('https://example.com/r/index.json')
      return new Response(JSON.stringify(fakeIndex), { status: 200 })
    }
    const result = await fetchIndex('https://example.com/r')
    expect(result).toEqual(fakeIndex)
  })

  test('exits on non-200 response', async () => {
    globalThis.fetch = async () => new Response('Not Found', { status: 404 })
    await expect(fetchIndex('https://example.com/r/')).rejects.toThrow('exit')
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('HTTP 404'))
  })

  test('exits on network error', async () => {
    globalThis.fetch = async () => { throw new Error('Network failure') }
    await expect(fetchIndex('https://example.com/r/')).rejects.toThrow('exit')
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Network failure'))
  })

  test('exits on invalid JSON', async () => {
    globalThis.fetch = async () => new Response('not json{{{', { status: 200 })
    await expect(fetchIndex('https://example.com/r/')).rejects.toThrow('exit')
    expect(exitSpy).toHaveBeenCalledWith(1)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid JSON'))
  })
})

describe('tryFetchIndex', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const fakeIndex: MetaIndex = {
    version: 1,
    generatedAt: '2026-01-01',
    components: [{ name: 'button', title: 'Button', category: 'input', description: 'A button', tags: ['button'], stateful: false }],
  }

  test('returns index on success', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify(fakeIndex), { status: 200 })
    const result = await tryFetchIndex('https://example.com/r/')
    expect(result).toEqual(fakeIndex)
  })

  test('returns null on HTTP error (no process.exit)', async () => {
    globalThis.fetch = async () => new Response('Not Found', { status: 404 })
    const result = await tryFetchIndex('https://example.com/r/')
    expect(result).toBeNull()
  })

  test('returns null on network error (no process.exit)', async () => {
    globalThis.fetch = async () => { throw new Error('offline') }
    const result = await tryFetchIndex('https://example.com/r/')
    expect(result).toBeNull()
  })

  test('returns null on invalid JSON (no process.exit)', async () => {
    globalThis.fetch = async () => new Response('not json{{{', { status: 200 })
    const result = await tryFetchIndex('https://example.com/r/')
    expect(result).toBeNull()
  })
})

describe('search - core docs', () => {
  const index = loadIndex(metaDir)
  const coreDocs = scanCoreDocs(docsDir)

  test('finds core doc by slug', () => {
    const results = search('create-signal', index, 'local', coreDocs)
    expect(results.some(r => r.type === 'doc' && r.name.includes('create-signal'))).toBe(true)
  })

  test('doc results have source "doc"', () => {
    const results = search('create-signal', index, 'local', coreDocs)
    const docs = results.filter(r => r.type === 'doc')
    expect(docs.length).toBeGreaterThan(0)
    expect(docs.every(r => r.source === 'doc')).toBe(true)
  })

  test('finds core doc by description keyword', () => {
    const results = search('hydration', index, 'local', coreDocs)
    expect(results.some(r => r.type === 'doc')).toBe(true)
  })

  test('mixed results: components + docs', () => {
    const results = search('input', index, 'local', coreDocs)
    expect(results.some(r => r.type === 'component')).toBe(true)
  })

  test('category alias: "signal" matches "reactivity" docs', () => {
    const results = search('signal', index, 'local', coreDocs)
    const reactivityDocs = results.filter(r => r.type === 'doc' && r.category === 'reactivity')
    expect(reactivityDocs.length).toBeGreaterThan(0)
  })

  test('returns empty when no match in either source', () => {
    const results = search('zzz_nonexistent_zzz', index, 'local', coreDocs)
    expect(results).toEqual([])
  })
})

describe('mergeResults', () => {
  test('deduplicates by name, local wins', () => {
    const local: SearchResult[] = [
      { name: 'button', type: 'component', source: 'local', category: 'input', description: 'local button' },
    ]
    const registry: SearchResult[] = [
      { name: 'button', type: 'component', source: 'registry', category: 'input', description: 'registry button' },
      { name: 'dialog', type: 'component', source: 'registry', category: 'overlay', description: 'a dialog' },
    ]
    const merged = mergeResults(local, registry)
    expect(merged).toHaveLength(2)
    expect(merged.find(r => r.name === 'button')!.source).toBe('local')
    expect(merged.find(r => r.name === 'dialog')!.source).toBe('registry')
  })

  test('preserves doc results from local', () => {
    const local: SearchResult[] = [
      { name: 'reactivity/create-signal', type: 'doc', source: 'doc', category: 'reactivity', description: 'signal doc' },
    ]
    const registry: SearchResult[] = [
      { name: 'slider', type: 'component', source: 'registry', category: 'input', description: 'a slider' },
    ]
    const merged = mergeResults(local, registry)
    expect(merged).toHaveLength(2)
    expect(merged.some(r => r.type === 'doc')).toBe(true)
  })

  test('empty local returns all registry', () => {
    const merged = mergeResults([], [
      { name: 'tooltip', type: 'component', source: 'registry', category: 'overlay', description: 'tooltip' },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0].source).toBe('registry')
  })

  test('empty registry returns all local', () => {
    const local: SearchResult[] = [
      { name: 'button', type: 'component', source: 'local', category: 'input', description: 'btn' },
    ]
    const merged = mergeResults(local, [])
    expect(merged).toHaveLength(1)
    expect(merged[0].source).toBe('local')
  })
})

describe('printSearchResults', () => {
  let logSpy: ReturnType<typeof spyOn>
  let logs: string[]

  beforeEach(() => {
    logs = []
    logSpy = spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  const oneResult: SearchResult[] = [
    { name: 'button', type: 'component', source: 'local', category: 'input', description: 'A button' },
  ]

  test('prints SOURCE column in table header', () => {
    printSearchResults(oneResult, false)
    expect(logs[0]).toContain('SOURCE')
    expect(logs[0]).toContain('NAME')
  })

  test('prints source value in each row', () => {
    const mixed: SearchResult[] = [
      { name: 'button', type: 'component', source: 'local', category: 'input', description: 'local btn' },
      { name: 'dialog', type: 'component', source: 'registry', category: 'overlay', description: 'reg dialog' },
    ]
    printSearchResults(mixed, false)
    const rows = logs.filter(l => !l.startsWith('NAME') && !l.startsWith('-') && !l.includes('found') && !l.includes('bf'))
    expect(rows.some(r => r.includes('local'))).toBe(true)
    expect(rows.some(r => r.includes('registry'))).toBe(true)
  })

  test('shows "No results found." for empty results', () => {
    printSearchResults([], false)
    expect(logs.some(l => l === 'No results found.')).toBe(true)
  })

  test('--json includes source field', () => {
    printSearchResults(oneResult, true)
    expect(logs).toHaveLength(1)
    const parsed = JSON.parse(logs[0])
    expect(parsed[0].source).toBe('local')
  })
})
