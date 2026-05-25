/**
 * BF031 `PROPS_TYPE_MISMATCH` deletion audit.
 *
 * BF031 was reserved for "Props type mismatch" but was never emitted.
 * TypeScript's own type-checking catches props type mismatches at the
 * language level (e.g., passing a string where a number is expected).
 */

import { describe, test, expect } from 'bun:test'
import ts from 'typescript'
import path from 'path'
import { analyzeComponent } from '../analyzer'
import { jsxToIR } from '../jsx-to-ir'
import { ErrorCodes } from '../errors'

function compileToIR(source: string) {
  const ctx = analyzeComponent(source, '/tmp/Test.tsx')
  const ir = jsxToIR(ctx)
  return { ctx, ir, errors: ctx.errors }
}

function getSemanticDiagnostics(source: string) {
  const baseDir = path.resolve(__dirname)
  const filePath = path.join(baseDir, '_props-mismatch-virtual.tsx')

  const virtualFiles = new Map<string, string>()
  virtualFiles.set(filePath, source)

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    jsxImportSource: 'react',
    strict: true,
    noEmit: true,
    skipLibCheck: true,
  }

  const defaultHost = ts.createCompilerHost(compilerOptions)

  const host: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile(fileName, languageVersion) {
      const resolved = path.resolve(fileName)
      const content = virtualFiles.get(resolved)
      if (content !== undefined) {
        return ts.createSourceFile(fileName, content, languageVersion, true)
      }
      return defaultHost.getSourceFile(fileName, languageVersion)
    },
    fileExists(fileName) {
      const resolved = path.resolve(fileName)
      if (virtualFiles.has(resolved)) return true
      return defaultHost.fileExists(fileName)
    },
    readFile(fileName) {
      const resolved = path.resolve(fileName)
      const content = virtualFiles.get(resolved)
      if (content !== undefined) return content
      return defaultHost.readFile(fileName)
    },
  }

  const program = ts.createProgram([filePath], compilerOptions, host)
  return program.getSemanticDiagnostics(program.getSourceFile(filePath)!)
}

describe('BF031 PROPS_TYPE_MISMATCH — deletion audit', () => {
  test('correct props compile without errors', () => {
    const src = `
interface Props { count: number; label: string }
export function Display(props: Props) {
  return <div>{props.label}: {props.count}</div>
}
`
    const { errors } = compileToIR(src)
    expect(errors).toHaveLength(0)
  })

  test('TypeScript catches props type mismatches', () => {
    const src = `
function Child(props: { count: number }) {
  return <div>{props.count}</div>
}
export function Parent() {
  return <Child count={"not a number"} />
}
`
    const diagnostics = getSemanticDiagnostics(src)
    expect(diagnostics.length).toBeGreaterThanOrEqual(1)
    const messages = diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
    expect(messages.some(m => m.includes('number') || m.includes('not assignable'))).toBe(true)
  })

  test('BF031 code no longer exists in ErrorCodes', () => {
    const allCodes = Object.values(ErrorCodes)
    expect(allCodes).not.toContain('BF031')
  })
})
