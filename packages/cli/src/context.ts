// CLI context: shared configuration passed to every command.

import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const thisDir = path.dirname(fileURLToPath(import.meta.url))

export interface BarefootConfig {
  $schema?: string
  name?: string
  paths: {
    components: string
    tokens: string
    meta: string
  }
}

export interface CliContext {
  root: string       // repo root (absolute)
  metaDir: string    // ui/meta/ (absolute)
  jsonFlag: boolean  // --json flag
  /** barefoot.json config if found (null = monorepo mode). */
  config: BarefootConfig | null
  /** Directory containing barefoot.json (absolute). */
  projectDir: string | null
}

/**
 * Search upward from startDir for barefoot.json.
 * Returns the absolute path to barefoot.json, or null if not found.
 */
export function findBarefootJson(startDir: string): string | null {
  let dir = path.resolve(startDir)
  const { root: fsRoot } = path.parse(dir)
  while (true) {
    const candidate = path.join(dir, 'barefoot.json')
    if (existsSync(candidate)) return candidate
    if (dir === fsRoot) return null
    dir = path.dirname(dir)
  }
}

/**
 * Load and parse barefoot.json from the given path.
 */
export function loadBarefootConfig(configPath: string): BarefootConfig {
  return JSON.parse(readFileSync(configPath, 'utf-8'))
}

/**
 * Create a CliContext.
 *
 * 1. Search upward from cwd for barefoot.json.
 * 2. If found, use its paths configuration.
 * 3. Otherwise, fall back to monorepo-relative paths.
 */
export function createContext(jsonFlag: boolean): CliContext {
  const configPath = findBarefootJson(process.cwd())

  if (configPath) {
    const projectDir = path.dirname(configPath)
    const config = loadBarefootConfig(configPath)
    const metaDir = path.resolve(projectDir, config.paths.meta)
    // root = monorepo root (for source lookups); projectDir = user project
    const root = path.resolve(thisDir, '../../..')
    return { root, metaDir, jsonFlag, config, projectDir }
  }

  // Fallback: monorepo mode
  const root = path.resolve(thisDir, '../../..')
  const metaDir = path.join(root, 'ui/meta')
  return { root, metaDir, jsonFlag, config: null, projectDir: null }
}
