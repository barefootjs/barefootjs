// Filesystem helpers shared across build pipeline steps.

import { fileExists, readBytes, readText, writeBytes, writeText } from './runtime'

/**
 * Write content to path only when it differs from what is already on disk.
 * Returns true when a write occurred. Avoids re-firing file watchers when
 * the output is byte-identical to the previous build.
 */
export async function writeIfChanged(
  path: string,
  content: string | ArrayBufferView | ArrayBuffer,
): Promise<boolean> {
  if (await fileExists(path)) {
    if (typeof content === 'string') {
      const prev = await readText(path)
      if (prev === content) return false
      await writeText(path, content)
      return true
    }
    const prev = await readBytes(path)
    const next = toUint8Array(content)
    if (equalBytes(prev, next)) return false
    await writeBytes(path, next)
    return true
  }
  if (typeof content === 'string') {
    await writeText(path, content)
  } else {
    await writeBytes(path, toUint8Array(content))
  }
  return true
}

function toUint8Array(content: ArrayBufferView | ArrayBuffer): Uint8Array {
  if (content instanceof ArrayBuffer) return new Uint8Array(content)
  return new Uint8Array(content.buffer, content.byteOffset, content.byteLength)
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
