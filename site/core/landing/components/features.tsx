/**
 * Features section component
 *
 * Displays Fine-grained reactivity benchmark and UI components showcase.
 */

const features = [
  {
    num: '01',
    title: 'Backend Freedom',
    description: 'Hono, Echo, Mojolicious... your favorite template',
  },
  {
    num: '02',
    title: 'MPA-style',
    description: 'Add to existing apps',
  },
  {
    num: '03',
    title: 'Fine-grained',
    description: 'Signal-based reactivity',
  },
  {
    num: '04',
    title: 'AI-native',
    description: 'CLI + fast IR tests',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-32 px-6 sm:px-12 border-t">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap">
          {features.map((feature) => (
            <div className="w-full sm:w-1/2 lg:w-1/4 p-6 sm:p-8 flex flex-col border-b lg:border-b-0 lg:border-r last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 lg:[&:nth-child(2n)]:border-r">
              <span className="text-xs font-mono text-[var(--gradient-start)] tracking-wider mb-4">
                {feature.num}
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * "One more thing..." teaser pointing to the UI components site.
 * The actual showcase lives at site/ui's home page; this is a brief
 * Apple-keynote-style nod from the LP so visitors discover it.
 */
export function UIComponentsSection({ uiHref = 'https://ui.barefootjs.dev' }: { uiHref?: string }) {
  return (
    <section className="py-32 px-6 sm:px-12 border-t">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-4">
          One more thing...
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          <span className="gradient-text">Ready-made</span> UI Components
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
          Pick a component. Copy the code. Make it yours.
        </p>
        <a href={uiHref} className="btn-primary inline-flex">
          Explore UI Components →
        </a>
      </div>
    </section>
  )
}
