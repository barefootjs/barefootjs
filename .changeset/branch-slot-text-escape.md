---
"@barefootjs/client": patch
---

`__bfSlot` now HTML-escapes its plain-string path, so text rendered inside a conditional `template()` branch is escaped to match the SSR output (closing the branch-text gap left by #1694, where only top-level text slots were escaped). The escape is applied on the string path only — live `Node` values still return raw `<!--bf-slot:N-->` markers for `insert()` to splice, so slotted content is preserved.
