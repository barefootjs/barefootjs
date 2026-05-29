---
"@barefootjs/jsx": patch
---

Make `tokenContainsIdent` regex-literal aware (#1370).

`scanForIdentifiers` (behind `tokenContainsIdent`) was the last hand-rolled
char-by-char string-state machine outside the shared `ts.createScanner`
lexer. It tracked quotes, template literals, and comments by hand but was
blind to regex literals, so a lone quote inside a regex (`/it's/`) flipped it
into string state and swallowed real identifier references, and an identifier
inside a regex body (`/className/`) was wrongly counted as a reference.

It now delegates to the shared `iterateJsTokens` lexer, which recognises
regex literals, nested template literals, and comments in one place. Prop
dependency detection on synthesised expression strings is now correct for
expressions containing regex literals. No change to adapter output for
existing fixtures.
