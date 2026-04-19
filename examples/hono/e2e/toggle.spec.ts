/**
 * Toggle E2E tests for Hono example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { toggleTests } from '../../shared/e2e/toggle.spec'

toggleTests('http://localhost:3001/examples/hono')
