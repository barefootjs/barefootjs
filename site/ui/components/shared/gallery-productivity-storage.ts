// Shared session-storage helpers for the /gallery/productivity app.
//
// Reactive primitives must stay in each consuming component — the compiler
// only recognizes createSignal / createEffect at the source call site. These
// are pure read/write helpers; components keep their own signal pairs inline.

const NAMESPACE = 'barefoot.gallery.productivity'

function storageKey(key: string): string {
  return `${NAMESPACE}.${key}`
}

function readRaw(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(storageKey(key))
  } catch {
    return null
  }
}

function writeRaw(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(storageKey(key), value)
    window.dispatchEvent(new CustomEvent('barefoot:productivity-storage', { detail: { key } }))
  } catch {
    /* ignore quota errors */
  }
}

export function readUnreadMailCount(fallback = 0): number {
  const raw = readRaw('unreadMailCount')
  if (raw == null) return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

export function writeUnreadMailCount(value: number): void {
  writeRaw('unreadMailCount', String(value))
}
