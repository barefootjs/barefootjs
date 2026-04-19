/**
 * ReactiveProps E2E tests for Hono example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { reactivePropsTests } from '../../shared/e2e/reactive-props.spec'

reactivePropsTests('http://localhost:3001/examples/hono')
