/**
 * BarefootJS Streaming - HTML Chunk Generators
 *
 * Backend-agnostic functions for generating OOS (Out-of-Order Streaming)
 * HTML chunks. These produce plain strings that any HTTP server can
 * write to a response stream.
 */

import { BF_ASYNC, BF_ASYNC_RESOLVE } from '@barefootjs/shared'

/**
 * Render an async boundary placeholder with fallback content.
 *
 * This HTML should be sent in the initial response (first flush)
 * and will be replaced when the async data resolves.
 *
 * @param id - Unique boundary ID (e.g., "a0")
 * @param fallbackHtml - HTML string to show while loading
 * @param tag - Wrapper element tag (default: "div")
 * @returns HTML string: `<div bf-async="a0">...fallback...</div>`
 */
export function renderAsyncBoundary(
  id: string,
  fallbackHtml: string,
  tag: string = 'div',
): string {
  return `<${tag} ${BF_ASYNC}="${id}">${fallbackHtml}</${tag}>`
}

/**
 * Render a resolve chunk for an async boundary.
 *
 * This HTML should be appended to the response stream after the async
 * data resolves. It contains the resolved content in a `<template>`
 * element and an inline `<script>` that triggers the swap.
 *
 * @param id - Boundary ID matching the placeholder
 * @param contentHtml - Resolved HTML content (including hydration markers)
 * @returns HTML string with template + swap script
 */
export function renderAsyncResolve(id: string, contentHtml: string): string {
  return (
    `<template ${BF_ASYNC_RESOLVE}="${id}">${contentHtml}</template>` +
    `<script>__bf_swap("${id}")</script>`
  )
}

/**
 * Generate the inline bootstrap script for OOS streaming.
 *
 * This script must be included once per page, before any streaming
 * resolve chunks arrive. It defines the `__bf_swap` function that
 * swaps fallback content with resolved content.
 *
 * The script is intentionally minimal (~300 bytes) and has no
 * dependencies on the BarefootJS runtime — it only manipulates DOM.
 * Full hydration is triggered via `__bf_hydrate` which is set up
 * by the BarefootJS client runtime's `setupStreaming()`.
 *
 * @returns A `<script>` tag string
 */
export function streamingBootstrap(): string {
  // Minified inline resolver — no external dependencies
  return `<script>(function(){function s(id){var a=document.querySelector('[${BF_ASYNC}="'+id+'"]');var t=document.querySelector('template[${BF_ASYNC_RESOLVE}="'+id+'"]');if(!a||!t)return;a.replaceChildren(t.content.cloneNode(true));a.removeAttribute('${BF_ASYNC}');t.remove();requestAnimationFrame(function(){if(window.__bf_hydrate)window.__bf_hydrate()})};window.__bf_swap=s})()</script>`
}
