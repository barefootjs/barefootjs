"use client"
/**
 * SocialProfileDemo
 *
 * Adapted UserProfileDemo for /gallery/social/profile.
 *
 * Compiler stress targets (inherited):
 * - Deep conditional nesting (3 levels: editing → verified → basic)
 * - Tabs with complex content switching
 * - Inline editing with save/cancel (shared editingField signal)
 * - Per-item array mutation (star/unstar repos)
 * - Filter + sort memo chain
 */

export { UserProfileDemo as SocialProfileDemo } from '../../user-profile-demo'
