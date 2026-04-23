"use client"
/**
 * SocialFeedPageDemo
 *
 * Adapted SocialFeedDemo for /gallery/social/feed.
 *
 * Compiler stress targets (inherited):
 * - Deeply nested composition: Feed > Post > Comments > Reply
 * - Conditional rendering inside loops (expanded/collapsed comments)
 * - Dynamic list updates (add comment → reconciliation)
 * - Loop-in-loop with events (replies inside comments inside posts)
 */

export { SocialFeedDemo as SocialFeedPageDemo } from '../../social-feed-demo'
