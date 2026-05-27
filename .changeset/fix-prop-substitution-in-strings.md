---
"@barefootjs/jsx": patch
---

Fix prop name substitution corrupting string literals in client JS (e.g. `"size-9"` → `"(_p.size ?? 'default')-9"`)
