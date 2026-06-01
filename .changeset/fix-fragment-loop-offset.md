---
"@barefootjs/jsx": patch
---

Fix a loop wrapped in a transparent fragment losing its parent container's preceding siblings when computing the `children[idx]` hydration offset (#1699, follow-up to #1688/#1693). A fragment (`<>…</>`) renders no DOM element wrapper, so a `.map()` inside it is a direct sibling of the fragment's siblings in the nearest ancestor element — but `computeLoopSiblingOffsets` treated the fragment as its own container boundary and reset the preceding-sibling run, so elements before the fragment were dropped from the offset and the mapped items resolved against the wrong `children[idx]` (their nested child components stayed inert after hydration). The offset pre-pass now flattens transparent containers (fragment / provider / async) into the enclosing run, so `<Box><hr/><hr/><>{xs.map(...)}</></Box>` correctly offsets the items past both `<hr/>`s while fragment-internal siblings keep counting too.
