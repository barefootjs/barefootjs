/**
 * Hero section — Design B
 *
 * Vertical layout: hero text on top, compiler flow diagram underneath.
 *   source code → Barefoot build → client.js (always) + selectable adapter
 *
 * Stateless server component; no signals required.
 */

import { highlight, initHighlighter } from './shared/highlighter'
import { SOURCE_CODE } from './shared/snippets'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Adapter = {
  id: string
  name: string
  lang: string
  // Either a logo url (svg in /static/logos/) or an inline svg string for icons
  // we don't have an asset for (Browser).
  logo?: string
  inlineIcon?: string
}

// Browser icon (inline SVG, fallback for adapters without a brand logo file).
const BROWSER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="9"/>
  <path d="M3 12h18"/>
  <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>
</svg>`

const ADAPTERS: Adapter[] = [
  // Icon-only marks: hono.dev official mark, labstack avatar (Echo),
  // Mojolicious favicon. Each is a square asset that fits the 36×36 slot.
  { id: 'hono',        name: 'Hono',        lang: 'TypeScript',            logo: '/static/logos/hono-icon.svg' },
  { id: 'echo',        name: 'Echo',        lang: 'Go',                     logo: '/static/logos/echo-icon.png' },
  { id: 'mojolicious', name: 'Mojolicious', lang: 'Perl',                   logo: '/static/logos/mojo-icon.png' },
  { id: 'browser',     name: 'Browser',     lang: 'Client Side Rendering',  inlineIcon: BROWSER_ICON },
]

// Inline barefoot footprint icon (5 toes)
const BAREFOOT_ICON = `<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" class="flow-build-icon">
  <ellipse cx="18" cy="36" rx="9" ry="12" transform="rotate(-15 20 46)"/>
  <ellipse cx="38" cy="34" rx="7" ry="10" transform="rotate(-8 38 44)"/>
  <ellipse cx="54" cy="38" rx="6" ry="9" transform="rotate(0 54 50)"/>
  <ellipse cx="68" cy="46" rx="4.5" ry="7" transform="rotate(8 68 56)"/>
  <ellipse cx="80" cy="57" rx="3.5" ry="5.5" transform="rotate(15 80 60)"/>
</svg>`

async function buildDiagramHtml(): Promise<string> {
  await initHighlighter()
  const codeHtml = highlight(SOURCE_CODE, 'tsx')

  // Adapter tabs (Hono / Echo / Mojolicious / Browser) — left-aligned in right column
  const adapterTabs = ADAPTERS.map((a, i) => {
    const iconHtml = a.logo
      ? `<img src="${esc(a.logo)}" alt="" class="flow-adapter-logo" />`
      : a.inlineIcon
        ? `<span class="flow-adapter-logo flow-adapter-logo-inline">${a.inlineIcon}</span>`
        : ''
    return `
    <button
      type="button"
      class="flow-output flow-adapter-tab${i === 0 ? ' is-active' : ''}"
      data-adapter="${a.id}"
      data-index="${i}"
      aria-pressed="${i === 0 ? 'true' : 'false'}"
    >
      ${iconHtml}
      <div class="flow-output-info">
        <span class="flow-output-name">${esc(a.name)}</span>
        <span class="flow-output-lang">${esc(a.lang)}</span>
      </div>
    </button>`
  }).join('')

  /*
   * SVG coordinate system: 220 × 500 — matches the connector width exactly,
   * so SVG x maps 1:1 to connector pixels and the line that exits the top
   * of the build box really sits at its horizontal centre.
   *
   *   Build box: square 110×110, x=45..155, y=195..305 (centre 100, 250).
   *   Source enters at y=250 (left edge x=0).
   *   Right-side outputs exit toward x=220.
   *
   *   Adapter list (5 boxes × 70 + 4 × 10 = 390) sits vertically centred:
   *     client.js   y=90, Hono y=170, Echo y=250 (straight from build),
   *     Mojolicious y=330, Browser y=410.
   *
   *   client.js stays solid. Exactly one of Hono/Echo/Mojolicious/Browser
   *   is solid; the rest are dashed. Active changes on click.
   */
  const G = '#22c55e'
  // Inactive adapter line: low-saturation green, same family as the solid
  // line so the two read as parallel rails when their elbows are offset.
  const Dg = 'rgba(34, 197, 94, 0.28)'
  const ADAPTER_YS = [170, 250, 330, 410] // Hono, Echo, Mojolicious, Browser
  // Active and inactive elbows live a few px apart so dashed/solid never
  // share a vertical segment.
  const ELBOW_ACTIVE = 188
  const ELBOW_INACTIVE = 198

  return `
    <div class="flow-diagram" id="flow-diagram">
      <div class="flow-source">
        <div class="flow-source-header">
          <div class="flow-source-header-left">
            <span class="flow-source-dot"></span>
            <span class="flow-source-filename">Counter.tsx</span>
          </div>
          <span class="flow-source-label">SOURCE</span>
        </div>
        <div class="flow-source-code">
          <pre class="shiki shiki-themes github-light github-dark" tabindex="0"><code>${codeHtml}</code></pre>
        </div>
      </div>

      <div class="flow-connector">
        <div class="flow-build">
          ${BAREFOOT_ICON}
          <img src="/static/logo-text.svg" alt="Barefoot.js" class="flow-build-logo-text" />
        </div>

        <svg class="flow-lines" viewBox="0 0 220 500" aria-hidden="true" preserveAspectRatio="none">
          <!-- source → build (left enters at y=250) -->
          <path d="M 0 250 L 45 250" stroke="${G}" stroke-width="1.25" fill="none"/>
          <circle cx="0" cy="250" r="2.5" fill="${G}"/>

          <!-- build → client.js (always solid, exits from the centred top
               edge of build, then turns right into the client.js card) -->
          <path d="M 100 195 L 100 90 L 220 90"
                stroke="${G}" stroke-width="1.25" fill="none"
                stroke-linejoin="miter" stroke-linecap="butt"/>
          <circle cx="220" cy="90" r="2.5" fill="${G}"/>

          <!-- build → adapters (one solid for active, others dashed) -->
          ${ADAPTER_YS.map((y, i) => {
            const isActive = i === 0
            const elbow = isActive ? ELBOW_ACTIVE : ELBOW_INACTIVE
            const path = (isActive && y === 250)
              ? `M 155 250 L 220 250`
              : `M 155 250 L ${elbow} 250 L ${elbow} ${y} L 220 ${y}`
            return `<path
              class="flow-adapter-line"
              data-adapter-line="${i}"
              data-y="${y}"
              d="${path}"
              stroke="${isActive ? G : Dg}"
              stroke-width="${isActive ? 1.25 : 1}"
              stroke-dasharray="${isActive ? '' : '4,3'}"
              fill="none"
            /><circle
              class="flow-adapter-dot"
              data-adapter-dot="${i}"
              cx="220" cy="${y}" r="2.5"
              fill="${isActive ? G : Dg}"
            />`
          }).join('')}
        </svg>
      </div>

      <div class="flow-adapters" role="tablist" aria-label="Output adapter">
        <!-- client.js: always solid, never selectable -->
        <div class="flow-output flow-output-client">
          <img src="/static/logos/javascript-icon.png" alt="" class="flow-adapter-logo" />
          <div class="flow-output-info">
            <span class="flow-output-name">client.js</span>
            <span class="flow-output-lang">Hydrate your template</span>
          </div>
        </div>
        ${adapterTabs}
      </div>
    </div>

    <script>
      (function () {
        var diagram = document.getElementById('flow-diagram');
        if (!diagram) return;
        var GREEN = '${G}';
        var GRAY = '${Dg}';
        var ELBOW_ACTIVE = ${ELBOW_ACTIVE};
        var ELBOW_INACTIVE = ${ELBOW_INACTIVE};
        var tabs = diagram.querySelectorAll('.flow-adapter-tab');
        var lines = diagram.querySelectorAll('.flow-adapter-line');
        var dots = diagram.querySelectorAll('.flow-adapter-dot');
        function pathFor(y, active) {
          if (active && y === 250) return 'M 155 250 L 220 250';
          var x = active ? ELBOW_ACTIVE : ELBOW_INACTIVE;
          return 'M 155 250 L ' + x + ' 250 L ' + x + ' ' + y + ' L 220 ' + y;
        }
        tabs.forEach(function (tab) {
          tab.addEventListener('click', function () {
            var idx = parseInt(tab.getAttribute('data-index') || '0', 10);
            tabs.forEach(function (t) {
              t.classList.remove('is-active');
              t.setAttribute('aria-pressed', 'false');
            });
            tab.classList.add('is-active');
            tab.setAttribute('aria-pressed', 'true');
            lines.forEach(function (l, i) {
              var active = i === idx;
              var y = parseInt(l.getAttribute('data-y') || '250', 10);
              l.setAttribute('d', pathFor(y, active));
              l.setAttribute('stroke', active ? GREEN : GRAY);
              l.setAttribute('stroke-width', active ? '1.25' : '1');
              l.setAttribute('stroke-dasharray', active ? '' : '4,3');
            });
            dots.forEach(function (d, i) {
              d.setAttribute('fill', i === idx ? GREEN : GRAY);
            });
          });
        });
      })();
    </script>`
}

export async function Hero() {
  const diagramHtml = await buildDiagramHtml()

  return (
    <section className="hero-b">
      <div className="hero-b-content">
        <div className="hero-b-text">
          <h1 className="hero-b-heading fade-in">
            TSX in.{' '}
            <span className="hero-b-accent">Your template language out.</span>
          </h1>
          <p className="hero-b-body fade-in-1">
            Barefoot compiles signal-based TSX directly into{' '}
            <strong>Hono</strong>, <strong>Echo</strong>, or the browser.
            <br />
            No virtual DOM. No SPA required.
          </p>
          <div className="hero-b-buttons fade-in-2">
            <a href="/docs/introduction" className="btn-primary">Get Started</a>
            <a href="/playground" className="btn-secondary">Playground →</a>
          </div>
        </div>
        <div className="hero-b-diagram fade-in-3">
          <div dangerouslySetInnerHTML={{ __html: diagramHtml }} />
        </div>
      </div>
    </section>
  )
}
