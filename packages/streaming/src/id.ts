/**
 * BarefootJS Streaming - Async Boundary ID Generator
 *
 * Generates unique, sequential IDs for async streaming boundaries.
 * Each page render should create a fresh generator instance.
 */

export class AsyncIdGenerator {
  private counter = 0

  /** Generate the next async boundary ID (e.g., "a0", "a1", "a2"). */
  next(): string {
    return `a${this.counter++}`
  }

  /** Reset the counter (e.g., between requests). */
  reset(): void {
    this.counter = 0
  }
}
