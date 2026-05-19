// Shared type definitions for component metadata extraction and CLI

// `'page'` covers top-level page / route components surfaced by the
// source-derived `bf docs` fallback (#1403). They live under
// `sourceDirs` (e.g. `components/Counter.tsx`) rather than the UI
// registry path that `bf meta extract` scans, so they have no
// persistent JSON in `meta/` — the meta object is reconstructed from
// the source on demand. The category serves as a visible marker that
// the user is looking at a source-derived view, not a registry entry.
export type ComponentCategory = 'input' | 'overlay' | 'navigation' | 'layout' | 'display' | 'page'

export interface PropMeta {
  name: string
  type: string
  required: boolean
  default?: string
  description: string
}

export interface SubComponentMeta {
  name: string
  description: string
  props: PropMeta[]
}

export interface ExampleMeta {
  title: string
  code: string
}

export interface AccessibilityMeta {
  role?: string
  ariaAttributes: string[]
  dataAttributes: string[]
}

export interface DependencyMeta {
  internal: string[]
  external: string[]
}

export interface SignalMeta {
  getter: string
  setter: string
  initialValue: string
}

export interface MemoMeta {
  name: string
  deps: string[]
}

export interface EffectMeta {
  deps: string[]
}

export interface CompilerErrorMeta {
  code: string
  message: string
  line: number
}

/**
 * Detailed per-component metadata (written to ui/meta/<name>.json).
 */
export interface ComponentMeta {
  name: string
  title: string
  category: ComponentCategory
  description: string
  tags: string[]
  stateful: boolean
  props: PropMeta[]
  subComponents?: SubComponentMeta[]
  variants?: Record<string, string[]>
  examples: ExampleMeta[]
  accessibility: AccessibilityMeta
  dependencies: DependencyMeta
  related: string[]
  source: string

  // Compiler-derived fields (from analyzeComponent)
  signals?: SignalMeta[]
  memos?: MemoMeta[]
  effects?: EffectMeta[]
  compilerErrors?: CompilerErrorMeta[]
}

/**
 * Compact per-component entry in the search index.
 */
export interface MetaIndexEntry {
  name: string
  title: string
  category: ComponentCategory
  description: string
  tags: string[]
  stateful: boolean
  subComponents?: string[]
}

/**
 * Search index (written to ui/meta/index.json).
 */
export interface MetaIndex {
  version: 1
  generatedAt: string
  components: MetaIndexEntry[]
}

/**
 * A single file entry in a RegistryItem (shadcn/ui registry format).
 */
export interface RegistryItemFile {
  path: string    // e.g. "components/ui/button/index.tsx"
  type: string    // e.g. "registry:ui"
  content: string // full file content
}

/**
 * Remote registry item (matches build-registry.ts output).
 */
export interface RegistryItem {
  $schema: string
  name: string
  type: string
  title: string
  description: string
  dependencies: string[]
  requires?: string[]
  files: RegistryItemFile[]
}
