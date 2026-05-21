---
title: Quick Start
description: Scaffold a BarefootJS app, run the dev server, and tour the generated layout
---

# Quick Start

This page walks through scaffolding a runnable BarefootJS app, starting the dev server, and editing the starter Counter. It assumes Node 22+ and one of npm / bun / pnpm / yarn.

## 1. Scaffold

<!-- tabs:pm -->
<!-- tab:npm -->
```sh
npm create barefootjs@latest
```

<!-- tab:bun -->
```sh
bun create barefootjs
```

<!-- tab:pnpm -->
```sh
pnpm create barefootjs
```

<!-- tab:yarn -->
```sh
yarn create barefootjs
```

<!-- /tabs -->

You'll be prompted for three things:

1. **Target directory** (default: `my-app`)
2. **Adapter** (default: **Hono** on Cloudflare Workers)
3. **CSS library** (default: **UnoCSS**)

Pass `--yes` to accept every default — including `my-app` for the directory — without prompting.

## 2. Install and run

```sh
cd my-app   # the name you entered at the prompt (default: my-app)
npm install
npm run dev
```

`npm run dev` runs three watchers in parallel:

- `bf build --watch` — recompiles JSX → marked template + client JS
- `unocss --watch` — regenerates `public/uno.css` from class usage
- `wrangler dev --live-reload` — serves the Hono worker on `http://localhost:8787`

Open the URL the dev server prints. You'll see a Counter with **+1**, **-1**, and **Reset** buttons — all server-rendered first, then hydrated.

## 3. Generated layout

```
my-app/
├── barefoot.config.ts     # paths, build options, adapter
├── server.tsx             # entry: Hono app
├── renderer.tsx           # HTML shell + asset wiring
├── components/
│   ├── Counter.tsx        # the starter component ("use client")
│   └── ui/
│       ├── button/        # added by `bf add button` at scaffold time
│       └── slot/
├── meta/index.json        # local component registry index
├── public/                # static assets — hand-written styles.css/tokens.css plus `bf build` + `unocss` output
├── uno.config.ts          # UnoCSS preset + scan globs
├── wrangler.jsonc         # Cloudflare Workers config
└── tsconfig.json
```

The single source of truth for project layout is `barefoot.config.ts`:

```ts
import { createConfig } from '@barefootjs/hono/build'

export default createConfig({
  paths: {
    components: 'components/ui',  // where `bf add` lands registry items
    tokens: 'tokens',
    meta: 'meta',
  },
  components: ['components'],     // source dirs to compile
  outDir: 'public',
})
```

## 4. Edit the Counter

`components/Counter.tsx` is a `"use client"` component using signals:

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

Props are accessed via `props.initial`, not destructured — destructuring captures the value once and breaks reactivity (the compiler emits warning [`BF043`](./advanced/error-codes.md) when it sees the destructured form). See [Props Reactivity](./reactivity/props-reactivity.md) for the full rule.

Save the file — `bf build --watch` recompiles and `wrangler dev` live-reloads.

## 5. Next steps

- `bf docs <component>` — show props, variants, examples for a registry component (`bf add` writes `meta/<name>.json` automatically, so this works straight after).
- `bf debug graph <component>` — show the signal dependency graph before editing a `"use client"` component.
- `bf add <name>` — add another shadcn/ui-style component from `https://ui.barefootjs.dev/`.
- `bf search <query>` — find components and docs across the registry.

Read on:

- [Core Concepts](./core-concepts.md) — the four design principles
- [Reactivity](./reactivity.md) — `createSignal`, `createEffect`, `createMemo`
- [Components](./components.md) — authoring, props, context, slots
- [Adapters](./adapters.md) — Hono, Go template, writing your own
