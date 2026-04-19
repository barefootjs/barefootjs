/**
 * ConditionalReturn E2E tests for Echo example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { conditionalReturnTests } from '../../shared/e2e/conditional-return.spec'

conditionalReturnTests('http://localhost:8080/examples/echo')
