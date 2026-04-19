/**
 * ConditionalReturn E2E tests for Hono example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { conditionalReturnTests } from '../../shared/e2e/conditional-return.spec'

conditionalReturnTests('http://localhost:3001/examples/hono')
