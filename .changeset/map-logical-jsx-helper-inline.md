---
"@barefootjs/jsx": patch
---

Inline JSX helpers and logical bodies inside reactive `.map()` children (#1665).

A `.map()` callback whose body was a logical expression (`cond && <X/>`,
`a ?? <X/>`) or a direct JSX-returning helper call (`themeLogo(t.id)`) was not
recognised by `transformMapCall` — only JSX-element, ternary, parenthesized,
`flatMap`-array, and block bodies were handled. The logical body fell through,
leaving the loop's children empty, so the whole `.map(...)` was emitted
verbatim as a reactive-text expression. That left inline JSX uncompiled and
module-level JSX helpers neither inlined nor declared, throwing
`ReferenceError: <helper> is not defined` at hydration.

Logical / JSX-helper-call callback bodies are now routed through the shared
JSX expression transformer, which lowers logical control flow into an
`IRConditional` and inlines the JSX helper — the same path the ternary form
already used. The routing is gated on the body actually rendering JSX (an
inline literal or a tracked helper call), so scalar logical bodies
(`t.active && t.label`) keep their existing reactive-text behaviour.
