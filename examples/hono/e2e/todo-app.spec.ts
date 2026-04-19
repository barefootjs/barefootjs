/**
 * TodoApp E2E tests for Hono example
 *
 * Uses shared test suite from examples/shared/e2e
 */

import { todoAppTests } from '../../shared/e2e/todo-app.spec'

todoAppTests('http://localhost:3001/examples/hono')
