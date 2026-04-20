# Integrations

Backend integration showcases. Each subdirectory is a small app that runs the
same JSX components on a different stack:

| Adapter | Runtime | Port | Where it runs in dev |
|---|---|---|---|
| `hono` | TypeScript / Cloudflare Workers | 3001 | host (`wrangler dev`) |
| `echo` | Go / Labstack Echo | 8080 | container |
| `mojolicious` | Perl / Mojolicious::Lite | 3004 | container |
| `csr` | TypeScript (no SSR) | 3000 | host |

## Development setup

The split is intentional: BarefootJS compilation (`bun run build`) and Hono
run on the host because the iteration loop is fastest there; Go and Perl
adapters run in containers so contributors don't need a local Go or Perl
toolchain.

```
host:                              containers (docker compose):
  - bun run build (per integration)  - echo        (golang + air)
  - hono dev (wrangler)              - mojolicious (perl + morbo)
  - dev proxy (scripts/dev-all.ts)
```

Containers bind-mount source and the host-built `dist/`, so editing JSX
on the host triggers a recompile that the container picks up via its
file-watcher.

### Working on a single adapter

Each compose service is independent (no `depends_on` between adapters), so
you can bring up just the one you're debugging:

```sh
# Just Mojolicious
docker compose up mojolicious

# Just Echo
docker compose up echo

# Both
docker compose up echo mojolicious
```

The container exposes its port directly to the host, so hit
`http://localhost:3004/integrations/mojolicious` (or `8080/integrations/echo`)
without needing the proxy.

### Working on the full stack

```sh
# Terminal 1 — recompile JSX on change for every adapter
bun run --filter 'barefootjs-*-example' build:watch

# Terminal 2 — bring up the container adapters
docker compose up

# Terminal 3 — Hono on host (Cloudflare Workers runtime)
bun run --filter barefootjs-hono-jsx-example dev

# Terminal 4 — proxy that fronts everything on a single port
bun run scripts/dev-all.ts   # http://localhost:4000
```

### Why dev images are separate from `Dockerfile`

`Dockerfile` (production) is consumed by `wrangler deploy` and ships only
the runtime + the host-built artifacts. `Dockerfile.dev` adds watcher tools
(`air` for Go, `morbo` for Perl) and expects source via bind mount. Keeping
them separate avoids bloating the production image and lets dev tooling
evolve independently.
