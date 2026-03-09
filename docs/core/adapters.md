---
title: Adapters
description: Bridge between the compiler's IR and your backend's template language, enabling cross-stack component reuse.
---

# Adapters

Adapters are the bridge between the compiler's IR and your backend's template language. The compiler produces a backend-agnostic Intermediate Representation (IR); an adapter converts it into a template your server can render.

```
JSX Source
    ↓
[Phase 1] → IR (backend-agnostic)
    ↓
[Phase 2a] IR → Adapter → Marked Template  (server)
[Phase 2b] IR → Client JS                  (browser)
```

The same JSX source produces correct output for any adapter. Your component library works across stacks.

## Available Adapters

| Adapter | Output | Backend | Package |
|---------|--------|---------|---------|
| [`HonoAdapter`](./adapters/hono-adapter.md) | `.hono.tsx` | Hono / JSX-based servers | `@barefootjs/hono` |
| [`GoTemplateAdapter`](./adapters/go-template-adapter.md) | `.tmpl` + `_types.go` | Go `html/template` | `@barefootjs/go-template` |

## Pages

| Topic | Description |
|-------|-------------|
| [Adapter Architecture](./adapters/adapter-architecture.md) | How adapters work, the `TemplateAdapter` interface, and the IR contract |
| [Hono Adapter](./adapters/hono-adapter.md) | Configuration and output format for Hono / JSX-based servers |
| [Go Template Adapter](./adapters/go-template-adapter.md) | Configuration and output format for Go `html/template` |
| [Writing a Custom Adapter](./adapters/custom-adapter.md) | Step-by-step guide to implementing your own adapter |
