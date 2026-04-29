<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/logo/logo-for-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="images/logo/logo-for-light.svg">
    <img alt="BarefootJS" src="images/logo/logo-for-light.svg" width="400">
  </picture>
</p>

<p align="center">
  <strong>TSX in. Your stack out.</strong><br>
  Barefoot compiles signal-based TSX into Hono, Echo, or whatever stack you ship on.<br>
  No virtual DOM. No SPA required.
</p>

> [!WARNING]
> **Alpha Software** — BarefootJS is in early alpha. APIs may change without notice. Not recommended for production use.

---

## Design Principles

- **Backend Freedom** — Same JSX works with Hono, Go, Mojolicious, etc. No Node.js lock-in.
- **MPA-style development** — Add interactivity to existing server apps without an SPA framework.
- **Fine-grained reactivity** — Signal-based, only affected DOM nodes update. SolidJS-equivalent performance.
- **AI-native development** — IR enables browser-free testing. CLI for component discovery. AI agents can develop autonomously.

---

## Documentation

- [barefootjs.dev](https://barefootjs.dev/) - Core documentation
- [ui.barefootjs.dev](https://ui.barefootjs.dev/) - UI components built with BarefootJS

---

## Acknowledgements

This project is inspired by and built with:

- [SolidJS](https://www.solidjs.com/) - Fine-grained reactivity model and Signal API design
- [shadcn/ui](https://ui.shadcn.com/) - UI component design system (docs/ui)
- [Hono](https://hono.dev/) - JSX runtime for server-side rendering

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
