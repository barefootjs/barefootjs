/**
 * Helpers for emitting code that parses a template literal into a DOM
 * element clone, while preserving the SVG namespace when the loop body
 * root is an SVG element.
 *
 * Background (#135): the standard pattern
 *   `const __tpl = document.createElement('template')`
 *   `__tpl.innerHTML = \`${template}\``
 *   `return __tpl.content.firstElementChild.cloneNode(true)`
 * works for HTML elements but produces an `HTMLUnknownElement` (xhtml
 * namespace, tagName uppercased) when `template` starts with an SVG
 * leaf like `<path>` or `<circle>`. The SVG renderer ignores those so
 * the element is invisible — bbox=(0,0,0,0). Surfaced by the Graph/DAG
 * Editor block when a new edge `<path>` was appended via mapArray and
 * never showed up on the canvas.
 *
 * Fix: when the template's root tag is an SVG element, wrap the parsed
 * markup in a synthetic `<svg>` so the HTML5 parser walks into SVG
 * foreign content and assigns the correct namespace, then descend one
 * extra level to get the real root.
 */

const SVG_ROOT_TAGS = new Set([
  'svg',
  'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse',
  'text', 'tspan', 'textPath',
  'g', 'defs', 'use', 'symbol', 'switch',
  'clipPath', 'mask', 'marker', 'pattern',
  'linearGradient', 'radialGradient', 'stop',
  'image', 'foreignObject',
  'filter', 'feBlend', 'feColorMatrix', 'feComposite', 'feFlood',
  'feGaussianBlur', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset',
  'feTurbulence',
  'animate', 'animateTransform', 'animateMotion',
])

/**
 * Decide whether a template literal needs SVG-context parsing.
 * Looks at the first opening tag in the literal. The check is purely
 * lexical so that interpolations inside attribute values do not
 * confuse it.
 *
 * Three shapes are recognised:
 *   1. Direct element root — `<circle .../>`
 *   2. Conditional body (#1088) — `${cond ? `<circle .../>` : `<rect .../>`}`
 *      where every result-position template literal starts with an SVG
 *      tag. The compiler emits this shape for `.map(s => cond ? <a/> : <b/>)`
 *      bodies; without the wrap the cloned element ends up in the xhtml
 *      namespace and renders nothing.
 *   3. Reactive-conditional body — a branch wrapped in `<!--bf-cond-start:sX-->`
 *      / `<!--bf-cond-end:sX-->` markers (emitted for nested reactive
 *      conditionals). The check skips leading HTML comments and recurses
 *      into the inner `${...}`.
 *
 * Mixed-namespace branches (one HTML, one SVG) intentionally fall through
 * to no-wrap so the user sees the same broken output as before instead of
 * a silent over-wrap into a `<foreignObject>`-style mismatch.
 */
export function templateRootIsSvg(template: string): boolean {
  const stripped = stripLeadingNonContent(template)

  // Shape 1: direct element root.
  const m = stripped.match(/^<\s*([A-Za-z][A-Za-z0-9-]*)/)
  if (m) {
    // SVG element names are case-sensitive in JSX (e.g., `linearGradient`)
    // and arrive lowercased to the renderer for the kebab-cased forms;
    // match case-insensitively against the canonical lower-case set, but
    // keep the canonical name's casing in the lookup table so JSX names
    // like `clipPath` still match.
    const tag = m[1]
    if (SVG_ROOT_TAGS.has(tag)) return true
    return SVG_ROOT_TAGS.has(tag.toLowerCase())
  }

  // Shapes 2 & 3: single `${...}` interpolation whose result-position
  // template literals all (recursively) resolve to SVG roots (Option A in
  // #1088).
  const branches = extractConditionalBranchTemplates(stripped)
  if (branches === null || branches.length === 0) return false
  return branches.every(templateRootIsSvg)
}

/**
 * Strip leading whitespace and HTML comment markers (`<!-- ... -->`) so
 * that a branch like `<!--bf-cond-start:s0-->${...}<!--bf-cond-end:s0-->`
 * is inspected at its first content node — the inner `${...}`.
 */
function stripLeadingNonContent(template: string): string {
  let s = template.trimStart()
  while (s.startsWith('<!--')) {
    const end = s.indexOf('-->')
    if (end < 0) return s
    s = s.slice(end + 3).trimStart()
  }
  return s
}

/**
 * If `template` begins with a `${jsExpr}` interpolation, return the
 * contents of every backtick template literal that appears at the top of
 * `jsExpr` — these are the result branches of a conditional like
 * `cond ? `<a/>` : `<b/>``. "Top of `jsExpr`" excludes backticks nested
 * inside another template literal's own `${...}`. Trailing HTML (typically
 * a `<!--bf-cond-end:sX-->` marker, all-whitespace) is ignored.
 *
 * Returns `null` when the shape doesn't match (no leading interpolation,
 * or the parser hits an unbalanced delimiter, or there is non-comment
 * trailing content) so callers conservatively bail to no-wrap.
 */
function extractConditionalBranchTemplates(template: string): string[] | null {
  if (!template.startsWith('${')) return null

  const exprEnd = findInterpolationEnd(template, 2)
  if (exprEnd < 0) return null

  // Anything after the closing `}` other than HTML comments / whitespace
  // means the template carries sibling HTML alongside the interpolation —
  // out of scope for the wrap heuristic.
  const trailing = stripLeadingNonContent(template.slice(exprEnd + 1))
  if (trailing.length > 0) return null

  const expr = template.slice(2, exprEnd)
  return findTopLevelTemplateLiterals(expr)
}

/**
 * Find the index of the `}` that closes a `${` opened immediately before
 * `start` in `template`. Tracks nested braces, strings, and template
 * literals so attribute-value interpolations don't trip the matcher.
 * Returns -1 on unbalanced input.
 */
function findInterpolationEnd(template: string, start: number): number {
  let depth = 1
  let i = start
  while (i < template.length) {
    const ch = template[i]
    if (ch === '\\') { i += 2; continue }
    if (ch === "'" || ch === '"') {
      i = skipString(template, i + 1, ch)
      if (i < 0) return -1
      continue
    }
    if (ch === '`') {
      i = skipTemplateLiteral(template, i + 1)
      if (i < 0) return -1
      continue
    }
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

function skipString(template: string, start: number, quote: string): number {
  let i = start
  while (i < template.length) {
    const ch = template[i]
    if (ch === '\\') { i += 2; continue }
    if (ch === quote) return i + 1
    i++
  }
  return -1
}

function skipTemplateLiteral(template: string, start: number): number {
  let i = start
  while (i < template.length) {
    const ch = template[i]
    if (ch === '\\') { i += 2; continue }
    if (ch === '`') return i + 1
    if (ch === '$' && template[i + 1] === '{') {
      const end = findInterpolationEnd(template, i + 2)
      if (end < 0) return -1
      i = end + 1
      continue
    }
    i++
  }
  return -1
}

/**
 * Walk a JS expression string and return the contents of every backtick
 * template literal that appears at the top level — i.e., not nested
 * inside another template literal. Parentheses are transparent so
 * `cond ? (`<a/>`) : (`<b/>`)` still surfaces both branches.
 *
 * Returns `null` if the parser sees an unbalanced delimiter; callers
 * treat that as "shape doesn't qualify for the wrap".
 */
function findTopLevelTemplateLiterals(expr: string): string[] | null {
  const out: string[] = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (ch === '\\') { i += 2; continue }
    if (ch === '/' && expr[i + 1] === '/') {
      const nl = expr.indexOf('\n', i + 2)
      i = nl < 0 ? expr.length : nl + 1
      continue
    }
    if (ch === '/' && expr[i + 1] === '*') {
      const end = expr.indexOf('*/', i + 2)
      if (end < 0) return null
      i = end + 2
      continue
    }
    if (ch === "'" || ch === '"') {
      const next = skipString(expr, i + 1, ch)
      if (next < 0) return null
      i = next
      continue
    }
    if (ch === '`') {
      const literalStart = i + 1
      const literalEnd = skipTemplateLiteral(expr, literalStart)
      if (literalEnd < 0) return null
      // literalEnd is the index just past the closing backtick.
      out.push(expr.slice(literalStart, literalEnd - 1))
      i = literalEnd
      continue
    }
    i++
  }
  return out
}

/**
 * Build the inline template-clone expression as one line.
 *
 *   ` const __tpl = document.createElement('template'); __tpl.innerHTML = \`${template}\`; return __tpl.content.firstElementChild.cloneNode(true) `
 *
 * For SVG roots, the `innerHTML` is wrapped in `<svg>...</svg>` and the
 * traversal descends one extra level.
 */
export function emitTemplateCloneInline(template: string): string {
  if (templateRootIsSvg(template)) {
    return `const __tpl = document.createElement('template'); __tpl.innerHTML = \`<svg>${template}</svg>\`; return __tpl.content.firstElementChild.firstElementChild.cloneNode(true)`
  }
  return `const __tpl = document.createElement('template'); __tpl.innerHTML = \`${template}\`; return __tpl.content.firstElementChild.cloneNode(true)`
}

/**
 * Multi-line variant for code paths that emit each line separately.
 * Returns three statements with no trailing newlines.
 */
export function emitTemplateCloneLines(template: string, indent: string): string[] {
  if (templateRootIsSvg(template)) {
    return [
      `${indent}const __tpl = document.createElement('template')`,
      `${indent}__tpl.innerHTML = \`<svg>${template}</svg>\``,
      `${indent}return __tpl.content.firstElementChild.firstElementChild.cloneNode(true)`,
    ]
  }
  return [
    `${indent}const __tpl = document.createElement('template')`,
    `${indent}__tpl.innerHTML = \`${template}\``,
    `${indent}return __tpl.content.firstElementChild.cloneNode(true)`,
  ]
}
