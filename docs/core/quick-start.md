---
title: Quick Start
description: Scaffold a BarefootJS app, run the dev server, and tour the generated layout
---

# Quick Start

This page walks through scaffolding a runnable BarefootJS app, starting the dev server, and editing the starter Counter. It assumes Node 22+ and one of npm / bun / pnpm / yarn.

> **Alpha note** — until the first npm publish, `npm create barefootjs@latest` is not yet on the registry. See [Alpha: install from pkg-pr-new](#alpha-install-from-pkg-pr-new) at the bottom of this page for the temporary install path.

## 1. Scaffold

<!-- tabs:pm -->
<!-- tab:npm -->
```sh
npm create barefootjs@latest my-app
```

<!-- tab:bun -->
```sh
bun create barefootjs my-app
```

<!-- tab:pnpm -->
```sh
pnpm create barefootjs my-app
```

<!-- tab:yarn -->
```sh
yarn create barefootjs my-app
```

<!-- /tabs -->

You'll be prompted for an adapter (default: **Hono** on Cloudflare Workers) and a CSS library (default: **UnoCSS**). Pass `--yes` to accept all defaults.

## 2. Install and run

```sh
cd my-app
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
├── public/                # build output (committed: no, gitignored)
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

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, setCount] = createSignal(initial)
  const doubled = createMemo(() => count() * 2)

  return (
    <div className="counter">
      <p>count: {count()}</p>
      <p>doubled: {doubled()}</p>
      <Button onClick={() => setCount(n => n + 1)}>+1</Button>
    </div>
  )
}
```

Save the file — `bf build --watch` recompiles and `wrangler dev` live-reloads.

## 5. Next steps

- `bf docs <component>` — show props, variants, examples for a registry component (after running `bf add <name>`, you may need to extract meta first with `bf meta extract`).
- `bf debug graph <component>` — show the signal dependency graph before editing a `"use client"` component.
- `bf add <name>` — add another shadcn/ui-style component from `https://ui.barefootjs.dev/`.
- `bf search <query>` — find components and docs across the registry.

Read on:

- [Core Concepts](./core-concepts.md) — the four design principles
- [Reactivity](./reactivity.md) — `createSignal`, `createEffect`, `createMemo`
- [Components](./components.md) — authoring, props, context, slots
- [Adapters](./adapters.md) — Hono, Go template, writing your own

## Alpha: install from pkg-pr-new

Until the packages are published to npm, install from per-PR previews built by [pkg-pr-new](https://github.com/stackblitz-labs/pkg-pr.new). The latest preview URLs are commented on each PR. To bootstrap:

```sh
# 1. Install create-barefootjs from the latest pkg-pr-new build:
mkdir -p /tmp/bf-installer && cd /tmp/bf-installer && npm init -y >/dev/null
npm install https://pkg.pr.new/piconic-ai/barefootjs/create-barefootjs@<PR-or-SHA>

# 2. Scaffold:
cd ~/projects
./tmp/bf-installer/node_modules/.bin/create-barefootjs my-app --yes

# 3. Rewrite @barefootjs/* deps in the generated package.json
#    from "latest" → "https://pkg.pr.new/.../<pkg>@<SHA>" (use the same
#    SHA pkg-pr-new pinned on create-barefootjs's @barefootjs/cli dep).

# 4. Continue normally:
cd my-app && npm install && npm run dev
```

This restriction goes away the moment the first npm publish lands.
