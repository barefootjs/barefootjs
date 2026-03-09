---
title: Writing a Custom Adapter
description: Step-by-step guide to building a custom adapter using the TestAdapter as a reference.
---

# Writing a Custom Adapter

This guide walks through building a custom adapter, using the `TestAdapter` (`packages/jsx/src/adapters/test-adapter.ts`) as a concrete example. The TestAdapter is a minimal, working adapter included in the compiler package — it generates simple JSX output and demonstrates every method you need to implement.


## Step 1: Implement `TemplateAdapter`

Create a class that extends `BaseAdapter` (or implements `TemplateAdapter` directly):

```typescript
import type {
  ComponentIR,
  IRNode,
  IRElement,
  IRText,
  IRExpression,
  IRConditional,
  IRLoop,
  IRComponent,
  IRFragment,
  ParamInfo,
} from '../types'
import { type AdapterOutput, BaseAdapter } from './interface'

export class TestAdapter extends BaseAdapter {
  name = 'test'
  extension = '.test.tsx'

  private componentName: string = ''

  generate(ir: ComponentIR): AdapterOutput {
    this.componentName = ir.metadata.componentName

    const imports = this.generateImports(ir)
    const types = this.generateTypes(ir)
    const component = this.generateComponent(ir)

    const template = [imports, types, component].filter(Boolean).join('\n\n')

    return {
      template,
      types: types || undefined,
      extension: this.extension,
    }
  }

  // ... node rendering methods (see below)
}
```

The `generate()` method is the entry point. It receives the full `ComponentIR` and returns an `AdapterOutput` containing the generated template, optional types, and the file extension.


## Step 2: Implement `renderNode()`

The dispatcher routes each IR node to the correct rendering method:

```typescript
renderNode(node: IRNode): string {
  switch (node.type) {
    case 'element':     return this.renderElement(node)
    case 'text':        return (node as IRText).value
    case 'expression':  return this.renderExpression(node)
    case 'conditional': return this.renderConditional(node)
    case 'loop':        return this.renderLoop(node)
    case 'component':   return this.renderComponent(node)
    case 'fragment':    return this.renderChildren((node as IRFragment).children)
    case 'slot':        return '{children}'
    default:            return ''
  }
}
```

Each `case` maps to one of the required `TemplateAdapter` methods. The `text` and `fragment` cases are simple enough to handle inline.


## Step 3: Implement Element Rendering

Elements are the most common node type. You need to:

1. Render the HTML tag and attributes
2. Insert hydration markers (`bf-s`, `bf`)
3. Render children recursively

```typescript
renderElement(element: IRElement): string {
  const tag = element.tag
  const attrs = this.renderAttributes(element)
  const children = this.renderChildren(element.children)

  let hydrationAttrs = ''
  if (element.needsScope) {
    hydrationAttrs += ' bf-s={__scopeId}'
  }
  if (element.slotId) {
    hydrationAttrs += ` bf="${element.slotId}"`
  }

  if (children) {
    return `<${tag}${attrs}${hydrationAttrs}>${children}</${tag}>`
  } else {
    return `<${tag}${attrs}${hydrationAttrs} />`
  }
}
```

### Attributes

The `renderAttributes()` helper handles static attributes, dynamic expressions, spread attributes, and event handlers:

```typescript
private renderAttributes(element: IRElement): string {
  const parts: string[] = []

  for (const attr of element.attrs) {
    const attrName = attr.name === 'class' ? 'className' : attr.name

    if (attr.name === '...') {
      parts.push(`{...${attr.value}}`)
    } else if (attr.value === null) {
      parts.push(attrName)           // Boolean attribute
    } else if (attr.dynamic) {
      parts.push(`${attrName}={${attr.value}}`)
    } else {
      parts.push(`${attrName}="${attr.value}"`)
    }
  }

  // Event handlers — render as no-op stubs for SSR
  for (const event of element.events) {
    const handlerName = `on${event.name.charAt(0).toUpperCase()}${event.name.slice(1)}`
    parts.push(`${handlerName}={() => {}}`)
  }

  return parts.length > 0 ? ' ' + parts.join(' ') : ''
}
```

**Note:** The TestAdapter renders event handlers as no-op stubs (`() => {}`) since JSX expects them to be present. In non-JSX adapters (like Go Template), event handlers are simply omitted — they only exist in the client JS.


## Step 4: Implement Expression Rendering

Expressions render dynamic values. Reactive expressions with a `slotId` get wrapped in a `<span>` with a hydration marker so the client JS can update them:

```typescript
renderExpression(expr: IRExpression): string {
  if (expr.expr === 'null' || expr.expr === 'undefined') {
    return 'null'
  }
  if (expr.reactive && expr.slotId) {
    return `<span bf="${expr.slotId}">{${expr.expr}}</span>`
  }
  return `{${expr.expr}}`
}
```

Since the TestAdapter outputs JSX, expressions pass through as-is (`{count()}`). A non-JSX adapter would need to convert the JavaScript expression into the target template language (e.g., `count()` → `{{.Count}}` for Go).


## Step 5: Implement Conditional Rendering

Ternary expressions in JSX stay as JSX ternaries in the TestAdapter output:

```typescript
renderConditional(cond: IRConditional): string {
  const whenTrue = this.renderNode(cond.whenTrue)
  const whenFalse = this.renderNode(cond.whenFalse)

  return `{${cond.condition} ? ${whenTrue} : ${whenFalse || 'null'}}`
}
```

**Input (JSX):**
```tsx
{isActive ? <span>Active</span> : <span>Inactive</span>}
```

**Output (TestAdapter):**
```tsx
{isActive ? <span>Active</span> : <span>Inactive</span>}
```

A non-JSX adapter would translate this into the target language's conditional syntax (e.g., `{{if .IsActive}}...{{else}}...{{end}}` for Go).


## Step 6: Implement Loop Rendering

Array `.map()` calls stay as JSX map expressions:

```typescript
renderLoop(loop: IRLoop): string {
  const indexParam = loop.index ? `, ${loop.index}` : ''
  const children = this.renderChildren(loop.children)

  return `{${loop.array}.map((${loop.param}${indexParam}) => ${children})}`
}
```

**Input (JSX):**
```tsx
{items.map(item => <li>{item.name}</li>)}
```

**Output (TestAdapter):**
```tsx
{items.map((item) => <li>{item.name}</li>)}
```

A non-JSX adapter would translate this into the target language's iteration syntax (e.g., `{{range .Items}}...{{end}}` for Go).


## Step 7: Implement Component Rendering

Nested components are rendered as JSX elements with the parent's scope ID passed through:

```typescript
renderComponent(comp: IRComponent): string {
  const props = this.renderComponentProps(comp)
  const children = this.renderChildren(comp.children)

  const scopeAttr = ' __bfScope={__scopeId}'

  if (children) {
    return `<${comp.name}${props}${scopeAttr}>${children}</${comp.name}>`
  } else {
    return `<${comp.name}${props}${scopeAttr} />`
  }
}
```

The `__bfScope` prop passes the parent's scope ID so nested components can participate in the hydration hierarchy.


## Step 8: Implement Hydration Markers

These methods generate the `bf-*` attributes in the target language's syntax:

```typescript
renderScopeMarker(instanceIdExpr: string): string {
  return `bf-s={${instanceIdExpr}}`
}

renderSlotMarker(slotId: string): string {
  return `bf="${slotId}"`
}

renderCondMarker(condId: string): string {
  return `bf-c="${condId}"`
}
```

The TestAdapter uses JSX expression syntax (`{...}`) for the scope marker since the value is dynamic. The slot and cond markers use plain string attributes since slot IDs are compile-time constants.


## Step 9: Generate Signal Initializers

Client components need signal getters to return initial values during SSR. The TestAdapter creates stub functions:

```typescript
private generateSignalInitializers(ir: ComponentIR): string {
  const lines: string[] = []

  for (const signal of ir.metadata.signals) {
    lines.push(`  const ${signal.getter} = () => ${signal.initialValue}`)
    lines.push(`  const ${signal.setter} = () => {}`)
  }

  for (const memo of ir.metadata.memos) {
    lines.push(`  const ${memo.name} = ${memo.computation}`)
  }

  return lines.join('\n')
}
```

For example, `const [count, setCount] = createSignal(initial)` becomes:
```typescript
const count = () => initial   // getter returns initial value
const setCount = () => {}     // setter is a no-op on the server
```

This allows the template to evaluate `count()` during SSR and render the initial value.


## Optional: Type Generation

If your backend language is typed, implement `generateTypes()`. The TestAdapter generates a hydration-extended props type:

```typescript
generateTypes(ir: ComponentIR): string | null {
  const lines: string[] = []

  const propsTypeName = ir.metadata.propsType?.raw
  if (propsTypeName) {
    lines.push(`type ${this.componentName}PropsWithHydration = ${propsTypeName} & {`)
    lines.push('  __instanceId?: string')
    lines.push('  __bfScope?: string')
    lines.push('}')
  }

  return lines.length > 0 ? lines.join('\n') : null
}
```

For dynamically-typed backends, return `null`.


## Testing Your Adapter

Use the compiler to verify your adapter output:

```typescript
import { compileJsxToIR } from '@barefootjs/jsx'
import { TestAdapter } from './test-adapter'

const source = `
"use client"
import { createSignal } from '@barefootjs/dom'

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial)
  return (
    <div>
      <p>{count()}</p>
      <button onClick={() => setCount(n => n + 1)}>+1</button>
    </div>
  )
}
`

const ir = compileJsxToIR(source)
const adapter = new TestAdapter()
const output = adapter.generate(ir)

console.log(output.template)
// export function Counter({ initial = 0, __instanceId, __bfScope }: CounterPropsWithHydration) {
//   const __scopeId = ...
//   const count = () => initial
//   const setCount = () => {}
//
//   return (
//     <div bf-s={__scopeId}>
//       <span bf="slot_0">{count()}</span>
//       <button bf="slot_1" onClick={() => {}}>+1</button>
//     </div>
//   )
// }
```


## Checklist

When building a custom adapter, ensure you handle:

- [ ] All IR node types (`element`, `text`, `expression`, `conditional`, `loop`, `component`, `fragment`, `slot`)
- [ ] Hydration markers (`bf-s`, `bf`, `bf-c`) on interactive elements
- [ ] Static vs. dynamic attributes
- [ ] Boolean HTML attributes (`disabled`, `checked`, etc.)
- [ ] Spread attributes (`{...props}`)
- [ ] Signal getter stubs for server-side initial values
- [ ] Nested component scope passing
- [ ] Props serialization (`bf-p` attribute) for client hydration
- [ ] Script registration for client JS loading
- [ ] `/* @client */` directive (skip client-only expressions server-side)

Production adapters handle additional concerns beyond what the TestAdapter covers:

- [ ] Void HTML elements (`<input>`, `<br>`, etc.) — no closing tag
- [ ] Expression translation to the target template language
- [ ] Type generation for typed backend languages
- [ ] `if-statement` and `provider` IR node types

### Reference Implementations

- **TestAdapter** (`packages/jsx/src/adapters/test-adapter.ts`) — Minimal working adapter used throughout this guide
- **HonoAdapter** (`packages/hono/src/adapter/hono-adapter.ts`) — Production JSX-to-JSX adapter with script collection via Hono's request context
- **GoTemplateAdapter** (`packages/go-template/src/adapter/go-template-adapter.ts`) — Production adapter with expression translation, type generation, and array method mapping
