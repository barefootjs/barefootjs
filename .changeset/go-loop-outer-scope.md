---
"@barefootjs/go-template": patch
---

Reference outer signals/props through Go template's `$` root scope inside a `{{range}}` loop body (#1677). Previously a reference like `sel()` or `props.x` used inside `items().map(...)` emitted `.Sel` / `.Active`, which Go resolves against the iteration element (no such field → `<nil>`); it now emits `$.Sel` / `$.Active`. The loop element's own fields stay element-scoped (`.ID`).
