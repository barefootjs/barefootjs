/**
 * Counter E2E tests for Echo example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { counterTests } from '../../shared/e2e/counter.spec'

counterTests('http://localhost:8080/examples/echo')
