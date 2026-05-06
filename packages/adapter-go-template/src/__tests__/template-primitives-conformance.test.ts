/**
 * Go-template adapter conformance for #1187 phase 3 template primitives.
 *
 * Cases live in `@barefootjs/adapter-tests`. Go's template runtime is
 * the html/template engine, which can render only callees the adapter
 * explicitly maps to a Go template function via `templatePrimitives`.
 * None mapped yet (#1188 will land them), so every positive-inlining
 * case is in the skip set until that PR.
 */

import {
  runConformanceSuite,
  templatePrimitiveCases,
  runTemplatePrimitiveCase,
  TemplatePrimitiveCaseId,
  type TemplatePrimitiveInput,
} from '@barefootjs/adapter-tests'
import { GoTemplateAdapter } from '../adapter'

runConformanceSuite<typeof TemplatePrimitiveCaseId[keyof typeof TemplatePrimitiveCaseId], TemplatePrimitiveInput, string>({
  name: 'template primitives conformance',
  issue: '#1187 phase 3',
  adapter: {
    name: 'go-template',
    factory: () => new GoTemplateAdapter(),
    skip: new Set([
      TemplatePrimitiveCaseId.JSON_STRINGIFY_VIA_CONST,
      TemplatePrimitiveCaseId.MATH_FLOOR_VIA_CONST,
      TemplatePrimitiveCaseId.USER_IMPORT_VIA_CONST,
      TemplatePrimitiveCaseId.NO_DOUBLE_REWRITE_OF_PROPS_OBJECT,
    ]),
  },
  cases: templatePrimitiveCases,
  run: runTemplatePrimitiveCase,
})
