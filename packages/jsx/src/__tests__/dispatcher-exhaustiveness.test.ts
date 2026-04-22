import { describe, test, expect } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const jsxToIrSource = readFileSync(
  join(import.meta.dir, '..', 'jsx-to-ir.ts'),
  'utf8',
)

// Pinned to `typescript@5.9.3` typescript.d.ts — the source of truth for
// spec/compiler.md Appendix A. If a TypeScript upgrade renames a kind or
// splits one into two, this list and the dispatcher's switch must be
// updated together. See A.4 for the verification workflow.
const appendixAKinds = [
  // Transparent
  'ParenthesizedExpression',
  'AsExpression',
  'SatisfiesExpression',
  'NonNullExpression',
  'TypeAssertionExpression',
  'PartiallyEmittedExpression',
  // JSX-structural
  'JsxElement',
  'JsxFragment',
  'JsxSelfClosingElement',
  'ConditionalExpression',
  'BinaryExpression',
  'CallExpression',
  // Scalar leaf
  'Identifier',
  'StringLiteral',
  'NumericLiteral',
  'BigIntLiteral',
  'RegularExpressionLiteral',
  'NoSubstitutionTemplateLiteral',
  'TemplateExpression',
  'TaggedTemplateExpression',
  'TrueKeyword',
  'FalseKeyword',
  'NullKeyword',
  'ThisKeyword',
  'SuperKeyword',
  'ImportKeyword',
  'PropertyAccessExpression',
  'ElementAccessExpression',
  'PrefixUnaryExpression',
  'PostfixUnaryExpression',
  'TypeOfExpression',
  'VoidExpression',
  'DeleteExpression',
  'NewExpression',
  'ObjectLiteralExpression',
  'ArrowFunction',
  'FunctionExpression',
  'ClassExpression',
  'MetaProperty',
  'ExpressionWithTypeArguments',
  'CommaListExpression',
  'SyntheticExpression',
  'ArrayLiteralExpression',
  // Forbidden
  'AwaitExpression',
  'YieldExpression',
  // Unreachable
  'SpreadElement',
  'OmittedExpression',
  'JsxExpression',
  'JsxOpeningElement',
  'JsxOpeningFragment',
  'JsxClosingFragment',
  'JsxAttributes',
  'MissingDeclaration',
]

/**
 * Regression coverage for the #971 dispatcher-unification guarantee.
 *
 * The *real* exhaustiveness check is enforced by `tsgo` during the package
 * build (`cd packages/jsx && bun run build` — part of CI): removing a
 * `case` from `transformJsxExpression` makes its `default` branch receive a
 * non-`never` type, and `assertNever(expr: never): never` fails to type-check
 * with `TS2345: Argument of type 'X' is not assignable to parameter of type
 * 'never'`. That alone is enough to catch accidental removals.
 *
 * These tests protect against the *next* failure mode: someone weakening the
 * guarantee without realising. If `assertNever` is called with an `as never`
 * cast, or a case is deleted from both the `JsxEmbeddableExpression` union
 * *and* the switch at the same time, `tsgo` stays green but the silent-drop
 * surface reappears. This suite fails fast in that case.
 */
describe('transformJsxExpression dispatcher exhaustiveness (#971)', () => {
  test('`assertNever` helper takes a `never` parameter', () => {
    expect(jsxToIrSource).toContain('function assertNever(expr: never): never')
  })

  test('dispatcher calls `assertNever` in the `default` branch without a type cast', () => {
    expect(jsxToIrSource).toMatch(/default:\s*\n\s*return assertNever\(node\)/)
    // No `as never`, `as any`, or `!`-assertion escape hatches — those would
    // pass tsgo regardless of how many cases are missing.
    expect(jsxToIrSource).not.toMatch(/return assertNever\(node as /)
    expect(jsxToIrSource).not.toMatch(/return assertNever\(node!/)
  })

  test('`JsxEmbeddableExpression` union lists every ts.SyntaxKind in spec Appendix A', () => {
    // The switch's exhaustiveness is only as strong as the union it narrows
    // over. If someone shrinks the union, tsgo keeps passing but the
    // dispatcher silently stops handling whichever kinds were removed.
    // Pin both here and in Appendix A.2 so the two stay in sync.
    const unionBlock = jsxToIrSource.match(
      /type JsxEmbeddableExpression =[\s\S]+?(?=\n\nfunction )/,
    )?.[0]
    expect(unionBlock).toBeDefined()
    for (const kind of appendixAKinds) {
      // Each kind appears once in the union type alias as `ts.KindName`.
      expect(unionBlock!).toContain(`ts.${ensureUnionMemberName(kind)}`)
    }
  })

  test('dispatcher switch has a `case` per ts.SyntaxKind in spec Appendix A', () => {
    // Appendix A is the source of truth; if a kind is in the appendix but
    // not in the dispatcher, a future refactor could narrow the union and
    // re-enable silent drops undetected.
    for (const kind of appendixAKinds) {
      expect(jsxToIrSource).toContain(`case ts.SyntaxKind.${kind}:`)
    }
  })
})

/**
 * Translate a `ts.SyntaxKind` name to the corresponding interface name used
 * in `typescript.d.ts` type declarations. Most kinds use the same name, but
 * a few rename (e.g., `SyntaxKind.TypeAssertionExpression` →
 * `interface TypeAssertion`, keyword literals → `FooLiteral`).
 */
function ensureUnionMemberName(kindName: string): string {
  const map: Record<string, string> = {
    TypeAssertionExpression: 'TypeAssertion',
    TrueKeyword: 'TrueLiteral',
    FalseKeyword: 'FalseLiteral',
    NullKeyword: 'NullLiteral',
    ThisKeyword: 'ThisExpression',
    SuperKeyword: 'SuperExpression',
    ImportKeyword: 'ImportExpression',
  }
  return map[kindName] ?? kindName
}
