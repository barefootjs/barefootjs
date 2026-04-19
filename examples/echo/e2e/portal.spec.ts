/**
 * Portal E2E tests for Echo example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { portalTests } from '../../shared/e2e/portal.spec'

portalTests('http://localhost:8080/examples/echo')
