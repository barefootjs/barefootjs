---
title: Props & Type Safety
description: Type component props with TypeScript interfaces and preserve type information through compilation.
---

# Props & Type Safety

Component props in BarefootJS are typed with TypeScript interfaces. The compiler preserves type information through compilation, and the adapter uses it to generate type-safe marked templates.

Props in client components are reactive — **how you access them matters**. See [Props Reactivity](../reactivity/props-reactivity.md) for the full explanation. This page focuses on typing patterns.


## Defining Props

Define props as an interface or type alias and annotate the function parameter:

```tsx
interface GreetingProps {
  name: string
  greeting?: string
}

export function Greeting(props: GreetingProps) {
  return <h1>{props.greeting ?? 'Hello'}, {props.name}</h1>
}
```


## Default Values

Use nullish coalescing (`??`) on the props object:

```tsx
function Button(props: { variant?: 'default' | 'primary'; children?: Child }) {
  const variant = props.variant ?? 'default'
  return <button className={variant}>{props.children}</button>
}
```

For props that are only used as an initial value for a signal, default parameter syntax is also fine. Note that the compiler emits warning `BF043` for destructuring, so add `@bf-ignore` to signal intent:

```tsx
// @bf-ignore props-destructuring
function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial)
  return <button onClick={() => setCount(n => n + 1)}>{count()}</button>
}
```


## Extending HTML Attributes

For components that wrap native elements, extend the corresponding HTML attribute type:

```tsx
import type { ButtonHTMLAttributes } from '@barefootjs/jsx'

interface ButtonProps extends ButtonHTMLAttributes {
  variant?: 'default' | 'primary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

function Button(props: ButtonProps) {
  const variant = props.variant ?? 'default'
  const size = props.size ?? 'md'
  const classes = `btn btn-${variant} btn-${size} ${props.className ?? ''}`

  return <button className={classes} {...props}>{props.children}</button>
}
```

This lets callers pass any standard button attribute (`type`, `disabled`, `aria-label`, etc.) alongside custom props.


## Rest Spreading

Use rest syntax to forward unknown props to the underlying element. Since rest spreading captures values once, use it for server components or for attributes that don't need reactive updates:

```tsx
function Card(props: { title: string; children?: Child } & HTMLAttributes) {
  return (
    <div className={props.className}>
      <h2>{props.title}</h2>
      {props.children}
    </div>
  )
}
```

```tsx
<Card title="Dashboard" className="shadow-lg" data-testid="dashboard-card">
  <p>Content</p>
</Card>
```


## Type Preservation

The compiler captures TypeScript type information for props and carries it through the IR. Each adapter uses this information to generate type-safe server output. For details on how types are mapped to specific backends, see [Adapters](../adapters.md).
