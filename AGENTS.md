# AGENTS.md

## Autonomous Coding Agent Guide

**Build, Lint, and Test Commands:**

- Install deps: `bun install`
- Build all: `bun run build:all`
- Dev all: `bun run dev:all`
- Dev dashboard/server: `bun run dev:dashboard`
- Lint: `bun run check` (Biome)
- Format: `bun run format`
- Typecheck: `bun run typecheck`
- Test dashboard: `bun run --filter dashboard test`
- Test single (dashboard): `bun run --filter dashboard test -- <pattern>`

**Code Style Guidelines:**

- Formatting: Biome (2-space indent, 80-char line, double quotes, LF endings)
- Imports: No auto-sorting; preserve import order
- Types: TypeScript everywhere; prefer explicit types/interfaces
- Naming: camelCase (vars/functions), PascalCase (types/components)
- Error Handling: Use try/catch for async, return typed errors
- React: Function components, hooks, TanStack conventions
- Astro: .astro for pages/layouts, .ts/.tsx for logic
- Accessibility/Security: Follow Biome rules
- No comments unless requested

> See README.md and biome.json for details. No Cursor or Copilot rules present.
