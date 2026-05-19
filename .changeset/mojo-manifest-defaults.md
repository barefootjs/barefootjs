---
"@barefootjs/jsx": minor
"@barefootjs/cli": minor
"@barefootjs/mojolicious": minor
---

Mojo scaffold one-line route handlers via manifest-embedded SSR defaults (issue #1416).

`bf build` now emits each component's destructured prop defaults plus statically-evaluable signal / memo initial values into the manifest's per-component `ssrDefaults` map. The Mojolicious plugin reads the manifest at plugin-register time and installs a `before_render` hook that, for every top-level component render, generates the scope id, registers every UI-registry child renderer from the manifest, and seeds the stash with each template variable's default. The scaffold's `app.pl` route handler shrinks to a single `$c->render(...)` line and stays untouched when the user runs `bf add <component>`.

The scaffolder's "Get started:" guide for `--adapter mojo` now includes the `cpanm --installdeps .` step so a fresh checkout works end-to-end without hunting for the bundled cpanfile.
