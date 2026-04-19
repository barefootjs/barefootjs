/**
 * Form E2E tests for Echo example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { formTests } from '../../shared/e2e/form.spec'

formTests('http://localhost:8080/examples/echo')
