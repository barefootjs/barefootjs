/**
 * Type-only verification that SVG element `ref` callbacks are typed with
 * the corresponding `SVG*Element` subtype, not the generic `HTMLElement`.
 *
 * The body of each callback accesses a property that is only available on
 * the narrower SVG type, so widening `ref` (e.g. via plain intersection
 * `HTMLBaseAttributes & { ref?: ... }`) would cause this file to fail
 * type-checking. There are no runtime assertions — `tsc --noEmit` (or the
 * project's typecheck) is the test runner.
 *
 * Compiled with `tsconfig.test.json` in this directory, which sets
 * `jsxImportSource: "@barefootjs/jsx"` and `strictFunctionTypes: true`.
 */

// Each ref callback uses an API specific to its narrow SVG type. If the
// type were widened to `HTMLElement`, these property accesses would fail.

// SVGSVGElement.viewBox is an SVGAnimatedRect, unique to <svg>.
const _svg = <svg ref={(el: SVGSVGElement) => { void el.viewBox }} />

// SVGGElement.transform is an SVGAnimatedTransformList.
const _g = <g ref={(el: SVGGElement) => { void el.transform }} />

// SVGPathElement.getTotalLength is path-specific.
const _path = <path ref={(el: SVGPathElement) => { void el.getTotalLength() }} />

// SVGCircleElement.r is an SVGAnimatedLength.
const _circle = <circle ref={(el: SVGCircleElement) => { void el.r.baseVal.value }} />

// SVGRectElement.x is an SVGAnimatedLength.
const _rect = <rect ref={(el: SVGRectElement) => { void el.x.baseVal.value }} />

// Suppress unused-binding warnings without enabling them in tsconfig.
export { _svg, _g, _path, _circle, _rect }
