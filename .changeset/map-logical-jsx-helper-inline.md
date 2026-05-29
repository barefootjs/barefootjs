---
"@barefootjs/jsx": patch
---

Inline JSX helpers in logical `.map()` callback bodies (#1665).

A `.map()` callback whose body was a JSX-rendering logical expression
(`cond && <X/>`, `cond && themeLogo(t.id)`, `a ?? <X/>`, `a ?? themeLogo(t.id)`)
was not recognised by `transformMapCall` — only JSX-element, ternary,
parenthesized, `flatMap`-array, and block bodies were handled. The logical body
fell through, leaving the loop's children empty, so the whole `.map(...)` was
emitted verbatim as a reactive-text expression. That left inline JSX uncompiled
and module-level JSX helpers neither inlined nor declared, throwing
`ReferenceError: <helper> is not defined` at hydration.

Such logical callback bodies are now routed through the shared JSX expression
transformer, which lowers the logical control flow into an `IRConditional` and
inlines any JSX helper — the same path the ternary form already used. The
`||`/`??` transformer now also recognises a right operand that renders JSX via
a tracked helper (not just an inline literal). The routing is scoped to logical
operators that actually render JSX, so scalar logical bodies (`t.active && t.label`)
and bare call bodies (`map(t => renderItem(t))`, which remain on the existing
reactive-text path) are unaffected.
