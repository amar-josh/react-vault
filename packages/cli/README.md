# @your-real-scope/create-app

```bash
npx @your-real-scope/create-app my-bank-app
```

Interactive prompts:

- Project name
- State management (RTK Query / TanStack Query)
- Install deps automatically? (Y/n)
- Initialise git? (Y/n)

Scaffolds: `_shared` template + selected variant overlay → `npm install` → `git init` → first commit.

The scaffolded project comes with `.claude/settings.json` enabling the `@your-real-scope/toolkit` plugin — Claude Code is BFSI-aware from the first session.
