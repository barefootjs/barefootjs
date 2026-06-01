---
"@barefootjs/jsx": patch
"@barefootjs/client": patch
---

Client-render templates now HTML-escape interpolated **text content** (the `<!--bf:sN-->${expr}<!--/-->` slots) via a new `escapeText` runtime helper — the parallel of the #1692 attribute-value fix. A string child containing `<` / `&` (e.g. `{user.name}`) was previously concatenated raw into the template string, which diverges from the SSR-escaped bytes and is a markup-injection vector when the template is inserted via `innerHTML`. Only the text-marker slots are escaped; bare `${children}` passthrough and `renderChild(...)` output are pre-rendered HTML and are left untouched. Hono escapes text with the same set as attribute values (`& " ' < >`), so `escapeText` delegates to the same operation for byte-parity with the conformance layer.
