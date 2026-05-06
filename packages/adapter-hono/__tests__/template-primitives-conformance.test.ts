/**
 * Hono adapter conformance for #1187 phase 3 template primitives.
 *
 * Cases live in `@barefootjs/adapter-tests` so adding a new case is a
 * single-file change shared across every adapter. Hono's runtime is
 * JS, so it satisfies every case via broad `acceptsTemplateCall`.
 */

import {
  runConformanceSuite,
  templatePrimitiveCases,
  runTemplatePrimitiveCase,
  type TemplatePrimitiveCaseId,
  type TemplatePrimitiveInput,
} from '@barefootjs/adapter-tests'
import { HonoAdapter } from '../src/adapter'

runConformanceSuite<TemplatePrimitiveCaseId, TemplatePrimitiveInput, string>({
  name: 'template primitives conformance',
  issue: '#1187 phase 3',
  adapter: {
    name: 'hono',
    factory: () => new HonoAdapter(),
    skip: new Set(),
  },
  cases: templatePrimitiveCases,
  run: runTemplatePrimitiveCase,
})
