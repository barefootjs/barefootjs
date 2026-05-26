---
'@barefootjs/cli': patch
---

Remove @barefootjs/cli from generated package.json dependencies; scaffold scripts now invoke the CLI via bunx/npx/pnpm dlx/yarn dlx instead of a locally installed `bf` binary.
