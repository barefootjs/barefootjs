---
"@barefootjs/test": minor
---

Resolve event-handler wiring on component props (e.g. `<Button onClick={...}>`, `<Switch onCheckedChange={...}>`), matching the `bf debug events` CLI. Component callback props are keyed by the DOM-style event name (onClick → click, onCheckedChange → checkedChange).
