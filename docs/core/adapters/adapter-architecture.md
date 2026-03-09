---
title: Adapter Architecture
description: How adapters convert the compiler's IR into server-renderable template formats.
---

# Adapter Architecture

An adapter converts the compiler's Intermediate Representation (IR) into a template format your server can render. This page explains how adapters work, the interface they implement, and the IR contract they consume.


## The Role of an Adapter

The BarefootJS compiler runs in two phases:

1. **Phase 1** parses JSX and produces a `ComponentIR` — a JSON tree that captures the component structure, reactive expressions, event handlers, and type information. This IR is backend-agnostic.
2. **Phase 2a** passes the IR to an adapter, which generates a marked template in the target language.
3. **Phase 2b** generates client JS directly from the IR (adapters are not involved in this step).

```
ComponentIR (JSON)
    ↓
┌───────────────────────────────┐
│         TemplateAdapter       │
│                               │
│  renderElement()              │
│  renderExpression()           │
│  renderConditional()          │
│  renderLoop()                 │
│  renderComponent()            │
│  ...                          │
└───────────────────────────────┘
    ↓
Marked Template + optional types
```

The adapter's job is to translate each IR node into the correct syntax for the target template language, inserting hydration markers (`bf-*` attributes) so the client JS can find and wire up interactive elements.


## The `TemplateAdapter` Interface

Every adapter implements the `TemplateAdapter` interface:

```typescript
interface TemplateAdapter {
  name: string       // Adapter identifier (e.g., 'hono', 'go-template')
  extension: string  // Output file extension (e.g., '.hono.tsx', '.tmpl')

  // Main entry point
  generate(ir: ComponentIR, options?: AdapterGenerateOptions): AdapterOutput

  // Node rendering — one method per IR node type
  renderNode(node: IRNode): string
  renderElement(element: IRElement): string
  renderExpression(expr: IRExpression): string
  renderConditional(cond: IRConditional): string
  renderLoop(loop: IRLoop): string
  renderComponent(comp: IRComponent): string

  // Hydration markers
  renderScopeMarker(instanceIdExpr: string): string
  renderSlotMarker(slotId: string): string
  renderCondMarker(condId: string): string

  // Optional: type generation for typed languages
  generateTypes?(ir: ComponentIR): string | null
}
```

### `generate()`

The main entry point. Receives the full `ComponentIR` and returns an `AdapterOutput`:

```typescript
interface AdapterOutput {
  template: string     // The generated template code
  types?: string       // Optional generated types (Go structs, etc.)
  extension: string    // File extension for the output
}
```

### `AdapterGenerateOptions`

```typescript
interface AdapterGenerateOptions {
  skipScriptRegistration?: boolean  // For child components bundled in parent
  scriptBaseName?: string           // For non-default exports sharing a parent's client JS
}
```

### Node rendering methods

Each method translates one IR node type into the target template language:

| Method | IR Node | Responsibility |
|--------|---------|----------------|
| `renderElement()` | `IRElement` | HTML elements with attributes, events, and hydration markers |
| `renderExpression()` | `IRExpression` | Dynamic expressions (e.g., `{count()}`, `{props.name}`) |
| `renderConditional()` | `IRConditional` | Ternaries and `&&`/`||` expressions |
| `renderLoop()` | `IRLoop` | `.map()`, `.filter().map()`, `.sort().map()` chains |
| `renderComponent()` | `IRComponent` | Nested component invocations |
| `renderNode()` | `IRNode` | Dispatcher — routes to the correct method based on node type |

### Hydration marker methods

These generate the `bf-*` attributes in the target language's syntax:

| Method | Marker | Purpose |
|--------|--------|---------|
| `renderScopeMarker()` | `bf-s` | Component boundary for scoped hydration |
| `renderSlotMarker()` | `bf` | Interactive element identifier |
| `renderCondMarker()` | `bf-c` | Conditional block for DOM switching |


## The `BaseAdapter` Class

For convenience, the compiler provides a `BaseAdapter` abstract class that implements the `TemplateAdapter` interface and adds a `renderChildren()` utility:

```typescript
abstract class BaseAdapter implements TemplateAdapter {
  abstract name: string
  abstract extension: string

  // ... all abstract methods from TemplateAdapter

  renderChildren(children: IRNode[]): string {
    return children.map(child => this.renderNode(child)).join('')
  }
}
```

Extending `BaseAdapter` is optional — you can implement `TemplateAdapter` directly if preferred.


## IR Node Types

The IR tree is composed of these node types. Each adapter must handle all of them:

### `IRElement`

An HTML element with attributes, events, and children.

```typescript
{
  type: 'element'
  tag: string              // 'div', 'button', 'input', etc.
  attrs: IRAttribute[]     // Static and dynamic attributes
  events: IREvent[]        // Event handlers (onClick, onChange, etc.)
  children: IRNode[]       // Child nodes
  slotId: string | null    // Hydration slot ID (e.g., 'slot_0')
  needsScope: boolean      // True if this is the component root
}
```

### `IRExpression`

A dynamic expression in the template.

```typescript
{
  type: 'expression'
  expr: string             // The JS expression (e.g., 'count()', 'props.name')
  reactive: boolean        // True if the expression depends on signals
  slotId: string | null    // Slot ID for client updates
  clientOnly?: boolean     // True if wrapped in /* @client */
}
```

### `IRConditional`

A ternary or logical expression that produces different output.

```typescript
{
  type: 'conditional'
  condition: string        // The JS condition
  whenTrue: IRNode         // Rendered when condition is true
  whenFalse: IRNode        // Rendered when condition is false
  reactive: boolean        // True if the condition depends on signals
  slotId: string | null    // Slot ID for DOM switching
}
```

### `IRLoop`

An array iteration (`.map()`, optionally chained with `.filter()` or `.sort()`).

```typescript
{
  type: 'loop'
  array: string            // The array expression
  param: string            // Iterator parameter name
  index: string | null     // Index parameter name
  children: IRNode[]       // Loop body
  isStaticArray: boolean   // True if iterating a prop (not a signal)
  filterPredicate?: {...}  // For .filter().map() chains
  sortComparator?: {...}   // For .sort().map() chains
}
```

### `IRComponent`

A nested component invocation.

```typescript
{
  type: 'component'
  name: string             // Component name (e.g., 'TodoItem')
  props: IRProp[]          // Props passed to the component
  children: IRNode[]       // Children (slots)
  slotId: string | null    // Slot ID if parent binds event handlers
}
```

### Other node types

| Type | Description |
|------|-------------|
| `IRText` | Static text content |
| `IRFragment` | Fragment (`<>...</>`) wrapper |
| `IRSlot` | `{children}` or `<Slot />` placeholder |
| `IRIfStatement` | Top-level if/else if/else blocks |
| `IRProvider` | Context provider wrapper |
| `IRTemplateLiteral` | Template literal expressions |


## Hydration Markers

Adapters insert `bf-*` attributes into the template so the client JS knows where to attach behavior:

| Marker | Example | Purpose |
|--------|---------|---------|
| `bf-s` | `<div bf-s="Counter_a1b2">` | Component boundary — scopes all queries inside |
| `bf` | `<p bf="slot_0">` | Interactive element — target for effects and event handlers |
| `bf-c` | `<div bf-c="slot_2">` | Conditional block — target for DOM switching |

The client JS uses these markers to find elements within a scope boundary, without interfering with nested component scopes.


## Script Registration

Client components need their client JS loaded in the browser. Adapters handle this by registering scripts during server rendering:

- **Hono**: Uses `useRequestContext()` to collect script paths. The `BfScripts` component renders the collected `<script>` tags.
- **Go Template**: Uses a `ScriptCollector` that tracks which component scripts are needed. The server renders the script tags at the end of the page.

This ensures each component's client JS is loaded exactly once, regardless of how many instances appear on the page.


## Type Generation

For typed backend languages, adapters can implement `generateTypes()` to produce type definitions alongside the template. The Go Template adapter generates:

- **Go structs** for component input and props types
- **JSON tags** for prop serialization
- **Constructor functions** like `New{Component}Props()` with default values

```go
// Generated by GoTemplateAdapter
type CounterInput struct {
    Initial int `json:"initial"`
}

type CounterProps struct {
    Initial  int    `json:"initial"`
    ScopeID  string `json:"scopeId"`
}

func NewCounterProps(input CounterInput) CounterProps {
    return CounterProps{
        Initial: input.Initial,
    }
}
```

Adapters for dynamically-typed languages (like Hono/TypeScript) can skip this by not implementing `generateTypes()`.
