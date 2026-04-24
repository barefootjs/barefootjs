"use client"
/**
 * ThemeCustomizerDemo
 *
 * Three context providers (palette, spacing, typography) with signal-driven values.
 * A deeply nested preview tree (12 levels) with consumers at every level reading
 * from one or more contexts. Dynamic add/remove of custom tokens.
 *
 * Compiler stress targets:
 * - Multiple createContext usages with signal-driven Provider values
 * - Multi-provider nesting: PaletteCtx > SpacingCtx > TypographyCtx
 * - 12-level deep consumer tree: each level reads from context via ref+createEffect
 * - Stale-read safety: changing any provider's signal → all consumers update
 * - Dynamic token list: add/remove rows in a reactive loop
 * - Multi-context consumer: PreviewCardHeader reads both PaletteCtx and TypographyCtx
 */

import { createContext, useContext, createSignal, createMemo, createEffect } from '@barefootjs/client'

// --- Types ---

type SpacingScale = 'compact' | 'normal' | 'spacious'
type FontFamily = 'sans' | 'serif' | 'mono'
type FontSize = 'sm' | 'base' | 'lg'

type CustomToken = {
  id: number
  name: string
  value: string
}

// --- Context value types ---

interface PaletteContextValue {
  primary: () => string
  secondary: () => string
  accent: () => string
}

interface SpacingContextValue {
  scale: () => SpacingScale
  gap: () => string
  padding: () => string
}

interface TypographyContextValue {
  fontFamily: () => string
  fontSize: () => string
}

// --- Contexts ---

const PaletteCtx = createContext<PaletteContextValue>({
  primary: () => '#3b82f6',
  secondary: () => '#64748b',
  accent: () => '#f59e0b',
})

const SpacingCtx = createContext<SpacingContextValue>({
  scale: () => 'normal',
  gap: () => '8px',
  padding: () => '16px',
})

const TypographyCtx = createContext<TypographyContextValue>({
  fontFamily: () => 'ui-sans-serif, system-ui, sans-serif',
  fontSize: () => '13px',
})

// --- Constants ---

const SPACING: Record<SpacingScale, { gap: string; padding: string }> = {
  compact: { gap: '4px', padding: '8px' },
  normal: { gap: '8px', padding: '16px' },
  spacious: { gap: '16px', padding: '24px' },
}

const FONT_FAMILIES: Record<FontFamily, string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, "Courier New", monospace',
}

const FONT_SIZES: Record<FontSize, string> = {
  sm: '11px',
  base: '13px',
  lg: '16px',
}

let _nextTokenId = 1
function nextTokenId(): number {
  return _nextTokenId++
}

// ============================================================
// Preview sub-components (deeply nested, context consumers)
// ============================================================

// Level 12: reads TypographyCtx + SpacingCtx — deepest consumer
function PreviewBadgeLabel() {
  const handleMount = (el: HTMLElement) => {
    const typography = useContext(TypographyCtx)
    const spacing = useContext(SpacingCtx)
    createEffect(() => {
      el.style.fontFamily = typography.fontFamily()
      el.style.fontSize = typography.fontSize()
      el.style.padding = `1px ${spacing.gap()}`
    })
  }
  return (
    <span
      ref={handleMount}
      className="preview-badge-label text-white leading-none"
      data-slot="preview-badge-label"
    >
      live
    </span>
  )
}

// Level 11: reads PaletteCtx
function PreviewBrandBadge() {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      el.style.backgroundColor = palette.accent()
    })
  }
  return (
    <span
      ref={handleMount}
      className="preview-brand-badge rounded"
      data-slot="preview-brand-badge"
    >
      <PreviewBadgeLabel />
    </span>
  )
}

// Level 10: reads TypographyCtx
function PreviewBrandText() {
  const handleMount = (el: HTMLElement) => {
    const typography = useContext(TypographyCtx)
    createEffect(() => {
      el.style.fontFamily = typography.fontFamily()
      el.style.fontSize = typography.fontSize()
      el.style.fontWeight = '600'
    })
  }
  return (
    <span
      ref={handleMount}
      className="preview-brand-text"
      data-slot="preview-brand-text"
    >
      AppName
    </span>
  )
}

// Level 9: reads PaletteCtx
function PreviewBrandIcon() {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      el.style.backgroundColor = palette.primary()
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-brand-icon w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
      data-slot="preview-brand-icon"
    >
      A
    </div>
  )
}

// Level 8: reads PaletteCtx + TypographyCtx
function PreviewHeaderBrand() {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      el.style.color = palette.primary()
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-header-brand flex items-center gap-1.5"
      data-slot="preview-header-brand"
    >
      <PreviewBrandIcon />
      <PreviewBrandText />
      <PreviewBrandBadge />
    </div>
  )
}

// Level 9: reads PaletteCtx
function PreviewNavChip(props: { label: string }) {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      el.style.color = palette.secondary()
    })
  }
  return (
    <span
      ref={handleMount}
      className="preview-nav-chip text-xs cursor-pointer px-1.5 py-0.5 rounded hover:opacity-70"
      data-slot="preview-nav-chip"
    >
      {props.label}
    </span>
  )
}

// Level 8: reads SpacingCtx
function PreviewHeaderNav() {
  const handleMount = (el: HTMLElement) => {
    const spacing = useContext(SpacingCtx)
    createEffect(() => {
      el.style.gap = spacing.gap()
    })
  }
  return (
    <nav
      ref={handleMount}
      className="preview-header-nav flex items-center"
      data-slot="preview-header-nav"
    >
      <PreviewNavChip label="Home" />
      <PreviewNavChip label="Docs" />
      <PreviewNavChip label="API" />
    </nav>
  )
}

// Level 7: reads PaletteCtx
function PreviewHeader() {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      el.style.borderBottomColor = palette.primary() + '40'
    })
  }
  return (
    <header
      ref={handleMount}
      className="preview-header flex items-center justify-between px-3 py-2 border-b"
      data-slot="preview-header"
    >
      <PreviewHeaderBrand />
      <PreviewHeaderNav />
    </header>
  )
}

// Level 10: reads PaletteCtx
function PreviewSidebarItem(props: { label: string; active: boolean }) {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      if (props.active) {
        el.style.backgroundColor = palette.primary()
        el.style.color = '#fff'
      } else {
        el.style.backgroundColor = 'transparent'
        el.style.color = palette.secondary()
      }
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-sidebar-item px-2 py-1 rounded text-xs cursor-pointer"
      data-slot="preview-sidebar-item"
      data-active={String(props.active)}
    >
      {props.label}
    </div>
  )
}

// Level 9: reads SpacingCtx
function PreviewSidebarNav() {
  const handleMount = (el: HTMLElement) => {
    const spacing = useContext(SpacingCtx)
    createEffect(() => {
      el.style.gap = spacing.gap()
      el.style.padding = `${spacing.gap()} ${spacing.padding()}`
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-sidebar-nav flex flex-col"
      data-slot="preview-sidebar-nav"
    >
      <PreviewSidebarItem label="Dashboard" active={true} />
      <PreviewSidebarItem label="Reports" active={false} />
      <PreviewSidebarItem label="Settings" active={false} />
    </div>
  )
}

// Level 8: reads SpacingCtx
function PreviewSidebar() {
  const handleMount = (el: HTMLElement) => {
    const spacing = useContext(SpacingCtx)
    createEffect(() => {
      el.style.width = spacing.scale() === 'compact' ? '80px' : spacing.scale() === 'spacious' ? '140px' : '108px'
    })
  }
  return (
    <aside
      ref={handleMount}
      className="preview-sidebar flex flex-col shrink-0 border-r border-border/40 bg-muted/20 overflow-hidden"
      data-slot="preview-sidebar"
    >
      <PreviewSidebarNav />
    </aside>
  )
}

// Level 12: reads PaletteCtx — deepest in content path
function PreviewCardValue(props: { label: string; accent: boolean }) {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      el.style.color = props.accent ? palette.accent() : palette.primary()
    })
  }
  return (
    <span
      ref={handleMount}
      className="preview-card-value text-xs font-semibold"
      data-slot="preview-card-value"
      data-accent={String(props.accent)}
    >
      {props.label}
    </span>
  )
}

// Level 11: reads SpacingCtx
function PreviewCardBody() {
  const handleMount = (el: HTMLElement) => {
    const spacing = useContext(SpacingCtx)
    createEffect(() => {
      el.style.gap = spacing.gap()
      el.style.padding = `${spacing.gap()} ${spacing.padding()}`
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-card-body flex flex-col"
      data-slot="preview-card-body"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Revenue</span>
        <PreviewCardValue label="$12,450" accent={true} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Users</span>
        <PreviewCardValue label="2,847" accent={false} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Conversion</span>
        <PreviewCardValue label="4.2%" accent={true} />
      </div>
    </div>
  )
}

// Level 10: reads PaletteCtx + TypographyCtx
function PreviewCardHeader(props: { title: string }) {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    const typography = useContext(TypographyCtx)
    createEffect(() => {
      el.style.color = palette.primary()
      el.style.fontFamily = typography.fontFamily()
      el.style.fontSize = typography.fontSize()
      el.style.fontWeight = '600'
      el.style.borderBottomColor = palette.primary() + '30'
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-card-header border-b px-3 py-1.5"
      data-slot="preview-card-header"
    >
      {props.title}
    </div>
  )
}

// Level 9: reads SpacingCtx
function PreviewCard(props: { title: string }) {
  const handleMount = (el: HTMLElement) => {
    const spacing = useContext(SpacingCtx)
    createEffect(() => {
      el.style.margin = `0 0 ${spacing.gap()} 0`
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-card rounded-lg border border-border/40 bg-card/80 overflow-hidden"
      data-slot="preview-card"
    >
      <PreviewCardHeader title={props.title} />
      <PreviewCardBody />
    </div>
  )
}

// Level 8: reads SpacingCtx
function PreviewContent() {
  const handleMount = (el: HTMLElement) => {
    const spacing = useContext(SpacingCtx)
    createEffect(() => {
      el.style.padding = spacing.padding()
      el.style.gap = spacing.gap()
    })
  }
  return (
    <div
      ref={handleMount}
      className="preview-content flex-1 flex flex-col overflow-hidden min-w-0"
      data-slot="preview-content"
    >
      <PreviewCard title="Analytics" />
    </div>
  )
}

// Level 7: structural only
function PreviewBody() {
  return (
    <div
      className="preview-body flex flex-1 min-h-0 overflow-hidden"
      data-slot="preview-body"
    >
      <PreviewSidebar />
      <PreviewContent />
    </div>
  )
}

// Level 6: structural only
function PreviewShell() {
  return (
    <div
      className="preview-shell flex flex-col h-full overflow-hidden rounded-lg border border-border/50 bg-background text-foreground text-xs"
      data-slot="preview-shell"
    >
      <PreviewHeader />
      <PreviewBody />
    </div>
  )
}

// ============================================================
// Custom Token Row — dynamic add/remove list
// ============================================================

function CustomTokenRow(props: {
  token: CustomToken
  onRemove: (id: number) => void
}) {
  return (
    <div
      className="custom-token-row flex items-center gap-2 py-1"
      data-slot="custom-token-row"
      data-token-id={String(props.token.id)}
    >
      <span className="text-xs font-mono text-foreground flex-1 truncate custom-token-name">
        {props.token.name}
      </span>
      <span className="text-xs font-mono text-muted-foreground custom-token-value">
        {props.token.value}
      </span>
      <button
        type="button"
        className="custom-token-remove-btn text-xs text-muted-foreground hover:text-destructive transition-colors"
        onClick={() => props.onRemove(props.token.id)}
        aria-label={`Remove ${props.token.name}`}
      >
        ×
      </button>
    </div>
  )
}

// ============================================================
// Root component
// ============================================================

export function ThemeCustomizerDemo() {
  // Palette signals
  const [primary, setPrimary] = createSignal('#3b82f6')
  const [secondary, setSecondary] = createSignal('#64748b')
  const [accent, setAccent] = createSignal('#f59e0b')

  // Spacing signals
  const [spacingScale, setSpacingScale] = createSignal<SpacingScale>('normal')
  const gap = createMemo(() => SPACING[spacingScale()].gap)
  const padding = createMemo(() => SPACING[spacingScale()].padding)

  // Typography signals
  const [fontFamily, setFontFamily] = createSignal<FontFamily>('sans')
  const [fontSize, setFontSize] = createSignal<FontSize>('base')
  const fontFamilyCss = createMemo(() => FONT_FAMILIES[fontFamily()])
  const fontSizeCss = createMemo(() => FONT_SIZES[fontSize()])

  // Custom tokens
  const [customTokens, setCustomTokens] = createSignal<CustomToken[]>([
    { id: nextTokenId(), name: '--brand-glow', value: '#93c5fd' },
    { id: nextTokenId(), name: '--surface-dim', value: '#f1f5f9' },
  ])
  const [newTokenName, setNewTokenName] = createSignal('')
  const [newTokenValue, setNewTokenValue] = createSignal('')

  const addToken = () => {
    const name = newTokenName().trim()
    const value = newTokenValue().trim()
    if (!name || !value) return
    setCustomTokens(prev => [...prev, { id: nextTokenId(), name, value }])
    setNewTokenName('')
    setNewTokenValue('')
  }

  const removeToken = (id: number) => {
    setCustomTokens(prev => prev.filter(t => t.id !== id))
  }

  // Ref callbacks for controlled color inputs
  const refPrimaryInput = (el: HTMLInputElement) => {
    createEffect(() => { el.value = primary() })
    el.addEventListener('input', (e: Event) => setPrimary((e.target as HTMLInputElement).value))
  }
  const refSecondaryInput = (el: HTMLInputElement) => {
    createEffect(() => { el.value = secondary() })
    el.addEventListener('input', (e: Event) => setSecondary((e.target as HTMLInputElement).value))
  }
  const refAccentInput = (el: HTMLInputElement) => {
    createEffect(() => { el.value = accent() })
    el.addEventListener('input', (e: Event) => setAccent((e.target as HTMLInputElement).value))
  }

  const refNewTokenNameInput = (el: HTMLInputElement) => {
    createEffect(() => { el.value = newTokenName() })
    el.addEventListener('input', (e: Event) => setNewTokenName((e.target as HTMLInputElement).value))
  }
  const refNewTokenValueInput = (el: HTMLInputElement) => {
    createEffect(() => { el.value = newTokenValue() })
    el.addEventListener('input', (e: Event) => setNewTokenValue((e.target as HTMLInputElement).value))
  }

  return (
    <PaletteCtx.Provider value={{ primary, secondary, accent }}>
      <SpacingCtx.Provider value={{ scale: spacingScale, gap, padding }}>
        <TypographyCtx.Provider value={{ fontFamily: fontFamilyCss, fontSize: fontSizeCss }}>
          <div className="theme-customizer-root flex gap-6 min-h-[500px]">

            {/* ── Controls Panel ── */}
            <div className="controls-panel flex flex-col gap-5 w-72 shrink-0" data-slot="controls-panel">

              {/* Palette */}
              <section className="controls-section" data-slot="controls-section" data-section="palette">
                <h3 className="text-sm font-semibold text-foreground mb-3">Palette</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20">Primary</label>
                    <input
                      type="color"
                      ref={refPrimaryInput}
                      className="palette-primary-input w-8 h-6 rounded border border-border cursor-pointer bg-transparent"
                      data-token="primary"
                    />
                    <span className="text-xs font-mono text-muted-foreground primary-hex">
                      {primary()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20">Secondary</label>
                    <input
                      type="color"
                      ref={refSecondaryInput}
                      className="palette-secondary-input w-8 h-6 rounded border border-border cursor-pointer bg-transparent"
                      data-token="secondary"
                    />
                    <span className="text-xs font-mono text-muted-foreground secondary-hex">
                      {secondary()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20">Accent</label>
                    <input
                      type="color"
                      ref={refAccentInput}
                      className="palette-accent-input w-8 h-6 rounded border border-border cursor-pointer bg-transparent"
                      data-token="accent"
                    />
                    <span className="text-xs font-mono text-muted-foreground accent-hex">
                      {accent()}
                    </span>
                  </div>
                </div>
              </section>

              {/* Spacing */}
              <section className="controls-section" data-slot="controls-section" data-section="spacing">
                <h3 className="text-sm font-semibold text-foreground mb-3">Spacing</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-20">Scale</label>
                  <select
                    value={spacingScale()}
                    onChange={(e: Event) => setSpacingScale((e.target as HTMLSelectElement).value as SpacingScale)}
                    className="spacing-scale-select flex-1 text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
                    data-slot="spacing-scale-select"
                  >
                    <option value="compact">Compact</option>
                    <option value="normal">Normal</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground spacing-values">
                  gap: {gap()} · padding: {padding()}
                </p>
              </section>

              {/* Typography */}
              <section className="controls-section" data-slot="controls-section" data-section="typography">
                <h3 className="text-sm font-semibold text-foreground mb-3">Typography</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20">Font</label>
                    <select
                      value={fontFamily()}
                      onChange={(e: Event) => setFontFamily((e.target as HTMLSelectElement).value as FontFamily)}
                      className="font-family-select flex-1 text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
                      data-slot="font-family-select"
                    >
                      <option value="sans">Sans-serif</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground w-20">Size</label>
                    <select
                      value={fontSize()}
                      onChange={(e: Event) => setFontSize((e.target as HTMLSelectElement).value as FontSize)}
                      className="font-size-select flex-1 text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
                      data-slot="font-size-select"
                    >
                      <option value="sm">Small (11px)</option>
                      <option value="base">Base (13px)</option>
                      <option value="lg">Large (16px)</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Custom Tokens */}
              <section className="controls-section" data-slot="controls-section" data-section="tokens">
                <h3 className="text-sm font-semibold text-foreground mb-3">Custom Tokens</h3>

                {/* Token list */}
                <div className="custom-token-list divide-y divide-border/50 mb-3" data-slot="custom-token-list">
                  {customTokens().map(t => (
                    <CustomTokenRow key={String(t.id)} token={t} onRemove={removeToken} />
                  ))}
                </div>

                {/* Token count badge */}
                <p className="text-xs text-muted-foreground mb-2 custom-token-count">
                  {customTokens().length} token{customTokens().length !== 1 ? 's' : ''}
                </p>

                {/* Add new token */}
                <div className="space-y-1.5">
                  <input
                    type="text"
                    ref={refNewTokenNameInput}
                    placeholder="--token-name"
                    className="add-token-name-input w-full text-xs rounded border border-border bg-background px-2 py-1 text-foreground placeholder:text-muted-foreground"
                    data-slot="add-token-name-input"
                  />
                  <input
                    type="text"
                    ref={refNewTokenValueInput}
                    placeholder="#value or 4px"
                    className="add-token-value-input w-full text-xs rounded border border-border bg-background px-2 py-1 text-foreground placeholder:text-muted-foreground"
                    data-slot="add-token-value-input"
                  />
                  <button
                    type="button"
                    onClick={addToken}
                    className="add-token-submit-btn w-full text-xs rounded border border-border bg-background hover:bg-accent hover:text-accent-foreground px-2 py-1 text-foreground transition-colors"
                    data-slot="add-token-submit-btn"
                  >
                    Add Token
                  </button>
                </div>
              </section>
            </div>

            {/* ── Preview Panel ── */}
            <div className="preview-panel flex-1 min-w-0" data-slot="preview-panel">
              <h3 className="text-sm font-semibold text-foreground mb-3">Preview</h3>
              <div className="preview-panel-frame h-80 rounded-lg border border-border/50 overflow-hidden">
                <PreviewShell />
              </div>
            </div>

          </div>
        </TypographyCtx.Provider>
      </SpacingCtx.Provider>
    </PaletteCtx.Provider>
  )
}
