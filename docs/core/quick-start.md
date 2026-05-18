---
title: Quick Start
description: Scaffold a BarefootJS app in under five minutes — Counter component, dev server, deploy.
---

# Quick Start

This guide walks you through scaffolding a BarefootJS app from scratch, running it locally, and understanding what the generator gave you. It should take about five minutes.

You'll end up with a working counter — a `"use client"` component that increments, decrements, and resets, rendered as server HTML and hydrated in the browser with a few KB of client JS.

## Prerequisites

- **Node.js 20+** (or a compatible runtime like Bun). `npm`, `bun`, `pnpm`, or `yarn` all work — the scaffolder detects your package manager.
- A terminal and a text editor.

No backend setup is required for this guide. The default scaffold targets [Cloudflare Workers](https://developers.cloudflare.com/workers/) via `wrangler dev`, which runs entirely on your laptop with no account or login.

## 1. Scaffold the project

Run the create command from the directory where you want the project folder to be created:

```bash
npm create barefootjs@latest my-app
```

You can also omit `my-app` to be prompted for a name, or pass `--yes` to accept every default (project name, adapter, CSS library) without any prompts — handy for CI or dotfiles.

The scaffolder asks two questions:

1. **Choose a framework or runtime** — defaults to **Hono (Cloudflare Workers)**. Other adapters (Go `html/template`, Mojolicious, Echo) are available but this guide assumes the default.
2. **Choose a CSS library** — defaults to **UnoCSS**, which the starter Counter relies on.

When it finishes, you'll see something like:

```
Get started:
  cd my-app
  npm install
  npm run dev
```

## 2. Install and run

```bash
cd my-app
npm install
npm run dev
```

`npm run dev` runs three processes in parallel:

- `bf build --watch` — the BarefootJS compiler. Watches `components/` and emits marked templates plus client JS to `public/components/`.
- `unocss --watch` — scans your JSX for utility classes and writes `public/uno.css`.
- `wrangler dev --live-reload` — Cloudflare's local Workers runtime. Serves the app and reloads the browser on rebuilds.

Open the URL Wrangler prints (typically `http://localhost:8787`). You should see a counter card with **+1**, **-1**, and **Reset** buttons. Click around — the value updates immediately in the browser.

## 3. Look at what was generated

Here's the project layout, with the files you'll touch most highlighted:

```
my-app/
├── server.tsx              # Hono routes — entry point
├── renderer.tsx            # HTML shell (<head>, <body>, BfScripts)
├── components/
│   └── Counter.tsx         # The starter component
├── components/ui/
│   └── button/             # Pulled from the BarefootJS UI registry
├── public/                 # Static assets served by Workers
│   ├── tokens.css          # CSS design tokens
│   ├── styles.css          # Counter + page styles
│   └── components/         # Generated client JS (bf build writes here)
├── barefoot.config.ts      # Compiler + paths config
├── wrangler.jsonc          # Cloudflare Workers config
└── uno.config.ts           # UnoCSS scan patterns
```

The Counter itself is the file to focus on. Open `components/Counter.tsx`:

```tsx
'use client'

import { createSignal, createMemo } from '@barefootjs/client'
import { Button } from '@/components/ui/button'

interface CounterProps {
  initial?: number
}

export function Counter(props: CounterProps) {
  const [count, setCount] = createSignal(props.initial ?? 0)
  const doubled = createMemo(() => count() * 2)

  return (
    <div className="counter">
      <p className="counter-value">count: {count()}</p>
      <p className="counter-doubled">doubled: {doubled()}</p>
      <div className="counter-buttons">
        <Button onClick={() => setCount(n => n + 1)}>+1</Button>
        <Button onClick={() => setCount(n => n - 1)} variant="secondary">-1</Button>
        <Button onClick={() => setCount(0)} variant="ghost">Reset</Button>
      </div>
    </div>
  )
}
```

A few things to notice:

- **`'use client'`** — opts this component into hydration. Without it, the compiler would render the JSX as static HTML and ship zero JS.
- **`createSignal`** — reactive state. The getter (`count`) is a function call inside JSX; that's how the compiler tracks dependencies.
- **`createMemo`** — a derived value. `doubled()` recomputes only when `count` changes.
- **`<Button>`** — a server component pulled from the UI registry. It renders to plain HTML; only the click handler ships as JS.

The server-side use of the Counter lives in `server.tsx`:

```tsx
import { Hono } from 'hono'
import { renderer } from './renderer'
import { Counter } from '@/components/Counter'

const app = new Hono()

app.use('*', renderer)

app.get('/', (c) =>
  c.render(
    <main>
      <Counter />
    </main>,
    { title: 'BarefootJS app' },
  ),
)

export default app
```

The same `Counter` import works on the server (renders HTML) and is wired up on the client (hydrates the buttons). One file, two outputs — that's the BarefootJS model.

## 4. Make a change

With `npm run dev` still running, edit `components/Counter.tsx` and change the initial value:

```tsx
export function Counter(props: CounterProps) {
  const [count, setCount] = createSignal(props.initial ?? 10) // was 0
  // ...
}
```

Save the file. The `bf build --watch` process rebuilds, Wrangler reloads the browser, and the counter now starts at **10**. The static HTML carries `10`, hydration picks up where the server left off, and your clicks continue working.

Try adding a new button:

```tsx
<Button onClick={() => setCount(n => n * 2)} variant="ghost">×2</Button>
```

Save and watch the browser update. No virtual DOM, no diff — the compiler generated an effect that updates only the `<p>` text node when `count` changes.

## 5. Deploy (optional)

When you're ready to ship:

```bash
npm run deploy
```

This runs `bf build`, generates the final `uno.css`, and calls `wrangler deploy`. The first deploy will prompt you to log into Cloudflare. After that, your app is live on `*.workers.dev`.

## Next steps

- **[Core Concepts](./core-concepts.md)** — the four design principles behind BarefootJS: backend freedom, MPA-style rendering, fine-grained reactivity, and AI-native workflows.
- **[`createSignal`](./reactivity/create-signal.md)** and **[`createMemo`](./reactivity/create-memo.md)** — the reactivity primitives you just used.
- **[Client Directive](./rendering/client-directive.md)** — exactly what `"use client"` does and when to reach for it.
- **[Hono Adapter](./adapters/hono-adapter.md)** — adapter-specific configuration and output details.
- Pick a different backend by passing `--adapter` to the scaffolder:

  ```bash
  npm create barefootjs@latest my-app -- --adapter go-template
  ```

  See [Adapter Architecture](./adapters/adapter-architecture.md) for the full list.
