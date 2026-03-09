---
title: Children & Slots
description: Accept nested JSX content via the children prop and enable polymorphic rendering with the Slot component.
---

# Children & Slots

Components accept nested JSX content through the `children` prop. The `Slot` component enables polymorphic rendering with the `asChild` pattern.


## Children

Any JSX nested inside a component tag is passed as the `children` prop:

```tsx
<Card>
  <h2>Title</h2>
  <p>Body text</p>
</Card>
```

```tsx
function Card(props: { children?: Child }) {
  return <div className="card">{props.children}</div>
}
```

`children` is typed as `Child`, which covers JSX elements, strings, numbers, and arrays.


## Passing Children Through

A component can pass `children` to a child element or another component:

```tsx
function Panel(props: { title: string; children?: Child }) {
  return (
    <section>
      <h2>{props.title}</h2>
      <div className="panel-body">{props.children}</div>
    </section>
  )
}
```

Wrapping `children` in a fragment (`<>{props.children}</>`) is treated as **transparent** — the compiler skips the fragment and processes children directly without extra hydration markers. See [Fragment](../rendering/fragment.md) for details.


## The `Slot` Component

`Slot` renders the child element with merged props and classes. It enables the **`asChild` pattern**, where a component's styling and behavior are applied to its child element instead of a wrapper:

```tsx
import { Slot } from './slot'

function Button({ className, asChild, children, ...props }: ButtonProps) {
  const classes = `btn btn-primary ${className}`

  if (asChild) {
    return <Slot className={classes} {...props}>{children}</Slot>
  }
  return <button className={classes} {...props}>{children}</button>
}
```

### How `Slot` Works

When `Slot` receives a valid element as `children`, it:

1. Extracts the child element's tag and props
2. Merges `className` from both `Slot` and the child (concatenated, space-separated)
3. Spreads remaining props from `Slot` onto the child
4. Renders the child's tag with the merged result

```tsx
// Input
<Slot className="btn" onClick={handleClick}>
  <a href="/home">Home</a>
</Slot>

// Output
<a href="/home" className="btn" onClick={handleClick}>Home</a>
```

If `children` is not a valid element (e.g., a string), `Slot` falls back to rendering it inside a fragment.


## The `asChild` Pattern

`asChild` lets a component delegate rendering to its child element. This is useful when you want a component's styling without its default HTML tag.

### Default rendering (no `asChild`)

```tsx
<Button variant="primary">Click me</Button>
// Renders: <button className="btn btn-primary">Click me</button>
```

### With `asChild`

```tsx
<Button variant="primary" asChild>
  <a href="/dashboard">Go to Dashboard</a>
</Button>
// Renders: <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
```

The `<a>` tag receives Button's classes and props. The component controls styling; the caller controls the underlying element.

### When to Use `asChild`

- **Navigation buttons** — Render a `<a>` with button styling
- **Custom triggers** — Render a custom element as a dialog or dropdown trigger
- **Accessibility** — Use the semantically correct element while reusing component styles

```tsx
// Dialog trigger as a custom element
<DialogTrigger asChild>
  <span role="button" tabIndex={0}>Open</span>
</DialogTrigger>
```


## Compound Component Children

Compound components use children to compose sub-components declaratively:

```tsx
<Dialog open={open()} onOpenChange={setOpen}>
  <DialogTrigger>Open</DialogTrigger>
  <DialogOverlay />
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
      <DialogDescription>Are you sure?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose>Cancel</DialogClose>
      <Button onClick={handleConfirm}>Yes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Each sub-component reads shared state from a context provider defined in the root component. See [Context API](./context-api.md) for how this works.


## Children in List Rendering

When rendering lists, pass data and callbacks to child components via props:

```tsx
{todos().map(todo => (
  <TodoItem
    key={todo.id}
    todo={todo}
    onToggle={() => handleToggle(todo.id)}
    onDelete={() => handleDelete(todo.id)}
  />
))}
```

The `key` attribute is required for efficient list updates. The compiler emits warning `BF023` if `key` is missing.
