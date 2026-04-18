/**
 * BarefootJS - Client Marker
 *
 * Update text content for @client directive expressions
 * that are evaluated only on the client side.
 */

/**
 * Update text content for a client marker.
 *
 * Expects comment marker format: <!--bf-client:sX-->
 * Both GoTemplateAdapter and HonoAdapter output this format for @client directives.
 *
 * A zero-width space (\u200B) is used as a prefix to mark text nodes managed by @client.
 * This allows distinguishing managed text nodes from other content.
 *
 * @param scope - The component scope element to search within
 * @param id - The slot ID (e.g., 's5')
 * @param value - The value to display (will be converted to string)
 */
export function updateClientMarker(scope: Element | null, id: string, value: unknown): void {
  if (!scope) return

  const marker = `bf-client:${id}`
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_COMMENT)

  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue === marker) {
      const comment = walker.currentNode
      let textNode = comment.nextSibling

      // Check if next sibling is our managed text node (prefixed with zero-width space)
      if (textNode?.nodeType !== Node.TEXT_NODE ||
          !textNode.nodeValue?.startsWith('\u200B')) {
        // Create new text node with zero-width space marker
        textNode = document.createTextNode('\u200B' + String(value ?? ''))
        // Insert after the comment node
        comment.parentNode?.insertBefore(textNode, comment.nextSibling)
      } else {
        // Update existing managed text node
        textNode.nodeValue = '\u200B' + String(value ?? '')
      }
      return
    }
  }
}
