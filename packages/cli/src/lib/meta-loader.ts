// Load component metadata from ui/meta/ directory.

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import type { MetaIndex, ComponentMeta, RegistryItem } from './types'

export function loadIndex(metaDir: string): MetaIndex {
  const indexPath = path.join(metaDir, 'index.json')
  if (!existsSync(indexPath)) {
    console.error(`Error: ${indexPath} not found.`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(indexPath, 'utf-8'))
}

export async function fetchIndex(registryUrl: string): Promise<MetaIndex> {
  const url = registryUrl.endsWith('/')
    ? `${registryUrl}index.json`
    : `${registryUrl}/index.json`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) }).catch((err: Error) => {
    console.error(`Error: Failed to fetch registry at ${url}: ${err.message}`)
    process.exit(1)
  }) as Response
  if (!res.ok) {
    console.error(`Error: Registry returned HTTP ${res.status} for ${url}`)
    process.exit(1)
  }
  try {
    return await res.json()
  } catch {
    console.error(`Error: Invalid JSON from registry at ${url}`)
    process.exit(1)
  }
  throw new Error('unreachable')
}

export async function fetchRegistryItem(registryUrl: string, name: string): Promise<RegistryItem> {
  const base = registryUrl.endsWith('/') ? registryUrl : `${registryUrl}/`
  const url = `${base}${name}.json`
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) }).catch((err: Error) => {
    console.error(`Error: Failed to fetch component "${name}" from ${url}: ${err.message}`)
    process.exit(1)
  }) as Response
  if (!res.ok) {
    console.error(`Error: Registry returned HTTP ${res.status} for ${url}`)
    process.exit(1)
  }
  try {
    return await res.json()
  } catch {
    console.error(`Error: Invalid JSON from registry at ${url}`)
    process.exit(1)
  }
  throw new Error('unreachable')
}

export function loadComponent(metaDir: string, name: string): ComponentMeta {
  const filePath = path.join(metaDir, `${name}.json`)
  if (!existsSync(filePath)) {
    const indexPath = path.join(metaDir, 'index.json')
    console.error(`Error: Component "${name}" not found at ${filePath}.`)
    console.error(`Available components are listed in ${indexPath}.`)
    console.error(`If you just ran \`bf add ${name}\`, run \`bf meta extract\` to regenerate the meta index.`)
    process.exit(1)
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}
