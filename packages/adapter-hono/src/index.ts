/**
 * BarefootJS Hono Integration
 *
 * Provides Hono-specific adapters and utilities for BarefootJS.
 */

// Hono Adapter for JSX compilation
export { HonoAdapter, honoAdapter } from './adapter'
export type { HonoAdapterOptions } from './adapter'

// BfScripts is exported from a separate entry point to avoid JSX runtime issues in tests
// Usage: import { BfScripts } from '@barefootjs/adapter-hono/scripts'
export type { CollectedScript } from './scripts'

// Portal components for SSR
// Usage: import { BfPortals, Portal } from '@barefootjs/adapter-hono/portals'
export type { CollectedPortal } from './portals'
export type { PortalProps } from './portal-ssr'

// Async streaming boundary
// Usage: import { BfAsync } from '@barefootjs/adapter-hono/async'
export type { BfAsyncProps } from './async'

// Dialog context for scopeId sharing
// Usage: import { DialogContext, useDialogContext } from '@barefootjs/adapter-hono/dialog-context'
export type { DialogContextValue } from './dialog-context'
