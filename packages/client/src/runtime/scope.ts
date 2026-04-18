/**
 * BarefootJS - Comment Scope Registry
 *
 * Registry for elements that serve as scope proxies for comment-based scopes.
 * Maps an element to its comment node and the sibling range boundary.
 */

import { BF_SCOPE_COMMENT_PREFIX } from '@barefootjs/shared'

/**
 * Information about a comment-based scope.
 */
export interface CommentScopeInfo {
  commentNode: Comment
  scopeId: string
}

/**
 * Registry mapping elements to their comment scope info.
 */
export const commentScopeRegistry = new WeakMap<Element, CommentScopeInfo>()

/**
 * Get the scope ID for an element from the comment scope registry.
 * Used by createPortal to resolve scope IDs for comment-based scopes.
 */
export function getPortalScopeId(element: Element): string | null {
  const info = commentScopeRegistry.get(element)
  return info?.scopeId ?? null
}

/**
 * Find the end boundary for a comment-based scope.
 * The boundary is the next bf-scope: comment or the end of the parent's children.
 */
export function getCommentScopeBoundary(commentNode: Comment): Node | null {
  let node: Node | null = commentNode.nextSibling
  while (node) {
    if (node.nodeType === Node.COMMENT_NODE &&
        (node as Comment).nodeValue?.startsWith(BF_SCOPE_COMMENT_PREFIX)) {
      return node
    }
    node = node.nextSibling
  }
  return null // End of parent's children
}
