// Adapter and CSS-library registries consumed by `barefoot init`.
//
// The actual template content for each adapter lives under
// `./adapters/<name>.ts` so this file stays focused on registration
// surface (types, the registry maps, and defaults).

import { CSR_ADAPTER } from './adapters/csr'
import { ECHO_ADAPTER } from './adapters/echo'
import { HONO_ADAPTER } from './adapters/hono'
import { MOJO_ADAPTER } from './adapters/mojo'
import type { PackageManager } from './pm'

/**
 * A package-manager-aware script value. Plain strings are emitted
 * verbatim; functions are evaluated against the detected PM so the
 * generated `package.json` quotes the right command (`bunx wrangler`
 * vs. `npx wrangler` vs. `pnpm dlx wrangler` vs. `yarn dlx wrangler`).
 */
export type AdapterScriptValue = string | ((pm: PackageManager) => string)

export interface AdapterTemplate {
  /** Human-readable name shown in CLI output. */
  label: string
  /** Default port the generated dev server listens on. */
  port: number
  /** Files (relative path → contents) the adapter contributes. */
  files: Record<string, string>
  /**
   * package.json scripts the adapter contributes. Values may be
   * functions to render PM-specific commands at scaffold time.
   */
  scripts: Record<string, AdapterScriptValue>
  /** package.json runtime dependencies. */
  dependencies: Record<string, string>
  /** package.json dev dependencies. */
  devDependencies: Record<string, string>
  /**
   * Optional deploy hint surfaced as a dedicated "Deploy:" section in
   * the post-scaffold guide. Adapters that don't have an obvious one-
   * command deploy story (Echo, Mojolicious, CSR) leave this unset
   * and the section is suppressed.
   */
  deploy?: {
    /** Section subtitle, e.g. "Cloudflare Workers". */
    target: string
    /** Script key in `scripts` that runs the deploy. */
    script: string
  }
  /**
   * Prerequisite warnings to surface to the user before scaffolding.
   * Returning a non-empty array signals "this adapter needs tools that
   * may not be installed" — init prints them but does not abort.
   */
  prereqWarnings: () => string[]
}

// CSS library options offered by `barefoot init`. The library is
// currently a presentational choice — the Hono adapter wires UnoCSS
// directly, and additional libraries (Tailwind, etc.) will eventually
// contribute their own files/scripts/deps once an adapter supports
// more than one. The registry exists so `--css` and the interactive
// selector have a real surface to pivot on.
export interface CssLibraryTemplate {
  /** Human-readable name shown in CLI output. */
  label: string
}

export const CSS_LIBRARIES: Record<string, CssLibraryTemplate> = {
  unocss: { label: 'UnoCSS' },
}

export const DEFAULT_CSS_LIBRARY = 'unocss'

export const ADAPTERS: Record<string, AdapterTemplate> = {
  hono: HONO_ADAPTER,
  echo: ECHO_ADAPTER,
  mojo: MOJO_ADAPTER,
  csr: CSR_ADAPTER,
}

export const DEFAULT_ADAPTER = 'hono'
