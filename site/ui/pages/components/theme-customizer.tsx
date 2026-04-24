/**
 * Theme Customizer Reference Page (/components/theme-customizer)
 *
 * Block-level composition pattern: three signal-driven context providers
 * (PaletteCtx, SpacingCtx, TypographyCtx) wrap a 12-level deep preview tree.
 * Every preview sub-component reads from one or more contexts via ref+createEffect,
 * exercising Provider value propagation, multi-provider ordering, and stale-read
 * safety when any Provider's signal changes.
 */

import { ThemeCustomizerDemo } from '@/components/theme-customizer-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'
import { getNavLinks } from '../../components/shared/PageNavigation'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
]

const previewCode = `"use client"

import { createContext, useContext, createSignal, createMemo, createEffect } from '@barefootjs/client'

// Three separate contexts — each with a signal-driven provider value

const PaletteCtx = createContext<{ primary: () => string; secondary: () => string; accent: () => string }>()
const SpacingCtx = createContext<{ scale: () => SpacingScale; gap: () => string; padding: () => string }>()
const TypographyCtx = createContext<{ fontFamily: () => string; fontSize: () => string }>()

export function ThemeCustomizer() {
  const [primary, setPrimary] = createSignal('#3b82f6')
  const [secondary, setSecondary] = createSignal('#64748b')
  const [accent, setAccent] = createSignal('#f59e0b')
  const [spacingScale, setSpacingScale] = createSignal<SpacingScale>('normal')
  const gap = createMemo(() => SPACING[spacingScale()].gap)
  const padding = createMemo(() => SPACING[spacingScale()].padding)
  const [fontFamily, setFontFamily] = createSignal<FontFamily>('sans')
  const [fontSize, setFontSize] = createSignal<FontSize>('base')
  const fontFamilyCss = createMemo(() => FONT_FAMILIES[fontFamily()])
  const fontSizeCss = createMemo(() => FONT_SIZES[fontSize()])

  return (
    // Multi-provider nesting: all three providers wrap the same tree.
    // PaletteCtx values resolve before SpacingCtx, before TypographyCtx.
    <PaletteCtx.Provider value={{ primary, secondary, accent }}>
      <SpacingCtx.Provider value={{ scale: spacingScale, gap, padding }}>
        <TypographyCtx.Provider value={{ fontFamily: fontFamilyCss, fontSize: fontSizeCss }}>
          {/* Controls + 12-level deep preview tree */}
        </TypographyCtx.Provider>
      </SpacingCtx.Provider>
    </PaletteCtx.Provider>
  )
}

// Consumer 12 levels deep — reads PaletteCtx
function PreviewCardValue(props: { label: string; accent: boolean }) {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    createEffect(() => {
      // Re-runs whenever primary() or accent() signal changes
      el.style.color = props.accent ? palette.accent() : palette.primary()
    })
  }
  return <span ref={handleMount}>{props.label}</span>
}

// Consumer 10 levels deep — reads BOTH PaletteCtx and TypographyCtx
function PreviewCardHeader(props: { title: string }) {
  const handleMount = (el: HTMLElement) => {
    const palette = useContext(PaletteCtx)
    const typography = useContext(TypographyCtx)
    createEffect(() => {
      el.style.color = palette.primary()
      el.style.fontFamily = typography.fontFamily()
      el.style.fontSize = typography.fontSize()
    })
  }
  return <div ref={handleMount}>{props.title}</div>
}`

export function ThemeCustomizerRefPage() {
  return (
    <DocPage slug="theme-customizer" toc={tocItems}>
      <div className="space-y-12">
        <PageHeader
          title="Theme Customizer"
          description="Three signal-driven context providers (palette, spacing, typography) wrapping a 12-level deep consumer tree. Tests Provider value propagation across deep trees, multi-provider ordering, stale-read safety, and dynamic token add/remove."
          {...getNavLinks('theme-customizer')}
        />

        <Section id="preview" title="Preview">
          <Example title="" code={previewCode}>
            <ThemeCustomizerDemo />
          </Example>
        </Section>

        <Section id="features" title="Features">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Multi-Provider Nesting</h3>
              <p className="text-sm text-muted-foreground">
                Three independent contexts —
                <code className="mx-1 text-xs">PaletteCtx</code>,
                <code className="mx-1 text-xs">SpacingCtx</code>, and
                <code className="mx-1 text-xs">TypographyCtx</code> — are all active
                simultaneously. The compiler must maintain separate context stacks for each
                and correctly resolve which Provider owns which consumer.
                <code className="mx-1 text-xs">PreviewCardHeader</code> (level 10) reads
                from both <code className="text-xs">PaletteCtx</code> and
                <code className="mx-1 text-xs">TypographyCtx</code> in the same mount
                callback, exercising multi-provider ordering.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">12-Level Deep Consumer Tree</h3>
              <p className="text-sm text-muted-foreground">
                The preview tree runs from the root to
                <code className="mx-1 text-xs">PreviewBadgeLabel</code> and
                <code className="mx-1 text-xs">PreviewCardValue</code> at level 12,
                with context consumers at every level.
                Changing the primary color updates the brand icon (level 9),
                the header brand (level 8), nav chips (level 9),
                the sidebar active item (level 10), the card header (level 10),
                and the card value (level 12) — all simultaneously on a single signal write.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Stale-Read Safety</h3>
              <p className="text-sm text-muted-foreground">
                Provider values contain signal getter references (e.g.{' '}
                <code className="text-xs">{'{ primary, secondary, accent }'}</code>
                ) not snapshot values. Consumers call
                <code className="mx-1 text-xs">ctx.primary()</code> inside
                <code className="mx-1 text-xs">createEffect</code>, subscribing to the
                live signal. Changing the primary color while the secondary is also
                changing (e.g., via rapid input) tests that no consumer reads a stale
                snapshot mid-render-chain.
              </p>
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">Dynamic Token List</h3>
              <p className="text-sm text-muted-foreground">
                The custom tokens array is a
                <code className="mx-1 text-xs">createSignal{'<CustomToken[]>'}</code>.
                Adding or removing a token re-runs the
                <code className="mx-1 text-xs">customTokens().map()</code> loop in JSX,
                exercising the compiler's key-based list reconciliation for a signal-driven
                loop whose length changes at runtime.
              </p>
            </div>
          </div>
        </Section>
      </div>
    </DocPage>
  )
}
