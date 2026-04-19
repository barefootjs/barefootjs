/**
 * TodoApp E2E tests for Echo example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { todoAppTests } from '../../shared/e2e/todo-app.spec'

todoAppTests('http://localhost:8080/examples/echo')
