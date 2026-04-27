/**
 * Type-only verification that SVG element `ref` callbacks are typed with
 * the corresponding `SVG*Element` subtype, not the generic `HTMLElement`.
 *
 * Each ref body accesses an API specific to its narrow SVG type — widening
 * `ref` (e.g. via plain intersection `HTMLBaseAttributes & { ref?: ... }`)
 * causes TS2322 here. There are no runtime assertions; the runner is
 * `tsc --noEmit -p packages/jsx/__tests__/tsconfig.json`.
 *
 * Bodies wrap the property access in `void` so the callback returns
 * `void`, matching the `(element: SVG*Element) => void` signature whether
 * the surrounding tooling picks up `tsconfig.json` or falls back to a
 * different JSX namespace (e.g. React's `Ref<T>`).
 *
 * The trailing `export {}` is load-bearing: without it the file is treated
 * as a script, the `@barefootjs/jsx` JSX namespace augmentation isn't
 * picked up, and every JSX element fails with "no interface
 * 'JSX.IntrinsicElements' exists" before the ref check runs.
 */

// SVGSVGElement.viewBox — SVGAnimatedRect, unique to <svg>.
const _svg = <svg ref={(el: SVGSVGElement) => { void el.viewBox }} />
// SVGGElement.transform — SVGAnimatedTransformList.
const _g = <g ref={(el: SVGGElement) => { void el.transform }} />
// SVGPathElement.getTotalLength — path-specific.
const _path = <path ref={(el: SVGPathElement) => { void el.getTotalLength() }} />
// SVGCircleElement.r — SVGAnimatedLength.
const _circle = <circle ref={(el: SVGCircleElement) => { void el.r.baseVal.value }} />
// SVGRectElement.x — SVGAnimatedLength.
const _rect = <rect ref={(el: SVGRectElement) => { void el.x.baseVal.value }} />
// SVGTSpanElement — note the unusual `TSpan` capitalisation; guards against
// future typos like `SVGTspanElement`.
const _tspan = <tspan ref={(el: SVGTSpanElement) => { void el.getNumberOfChars() }} />
// SVGForeignObjectElement — likewise guards `Foreign`/`Object` casing.
const _fo = <foreignObject ref={(el: SVGForeignObjectElement) => { void el.x.baseVal.value }} />

export { _svg, _g, _path, _circle, _rect, _tspan, _fo }
