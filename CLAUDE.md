# Contentta - Claude Code Guidelines

AI-powered CMS built as an Nx monorepo with Bun. Provides AI-assisted content creation, SERP analysis, content optimization, and team collaboration.

---

## Commands

```bash
# Development
bun dev              # Start web, sdk-server, worker in parallel
bun dev:all          # Start all apps and packages
bun dev:worker       # Worker only

# Build & Quality
bun run build        # Build all (Nx cached)
bun run typecheck    # TypeScript checks
bun run check        # Biome lint/format
bun run test         # Tests with parallelization

# Database
bun run db:push      # Push schema changes
bun run db:studio    # Drizzle Studio GUI

# Scripts (all in root scripts/ directory)
bun run scripts/seed-default-dashboard.ts run [--env production] [--dry-run]
bun run scripts/seed-event-catalog.ts run [--env production] [--dry-run]
bun run scripts/reindex-content.ts
```

---

## Monorepo Structure

```
contentta-nx/
├── apps/
│   ├── web/             # React/Vite SPA — main dashboard + oRPC routers
│   ├── sdk-server/      # Elysia API server for SDK consumers
│   └── worker/          # BullMQ background job processor (plain Bun process)
├── packages/
│   ├── agents/          # Mastra AI agents (planning, research, editing)
│   ├── analytics/       # Analytics engine
│   ├── arcjet/          # Rate limiting & DDoS protection
│   ├── authentication/  # Better Auth setup
│   ├── database/        # Drizzle ORM schemas & repositories
│   ├── environment/     # Zod-validated env vars (server/worker/client)
│   ├── events/          # Event catalog, schemas, emit, credits
│   ├── files/           # MinIO & file utilities
│   ├── logging/         # Pino logger
│   ├── posthog/         # Analytics client
│   ├── queue/           # BullMQ abstractions (producer side)
│   ├── redis/           # Redis singleton (getRedisConnection())
│   ├── search/          # Web search providers (Tavily/Exa/Firecrawl)
│   ├── stripe/          # Stripe SDK wrapper
│   ├── transactional/   # Email templates (React Email + Resend)
│   ├── ui/              # Radix + Tailwind + CVA components
│   └── utils/           # Shared utilities + error classes
├── libraries/
│   └── sdk/             # TypeScript SDK for Contentta API
└── tooling/
    └── typescript/      # Shared TypeScript configs
```

---

## API Layer — oRPC (NOT tRPC)

Routers live in `apps/web/src/integrations/orpc/router/`. Uses `@orpc/server`, NOT tRPC.

**Available routers:** account, actions, agent, analytics, annotations, api-keys, billing, chat, content, content-analytics, dashboards, data-sources, event-catalog, forms, insights, onboarding, organization, personal-api-key, property-definitions, sdk-usage, session, team, usage, webhooks

**Router pattern:**
```typescript
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../server";

export const getAll = protectedProcedure
   .input(z.object({ teamId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      // context: { db, posthog?, organizationId, userId, session, auth, headers, request, stripeClient? }
   });
```

**Errors in routers:** Use `ORPCError` — NOT native `Error`, NOT `APIError`/`AppError`:
```typescript
throw new ORPCError("NOT_FOUND", { message: "Content not found" });
throw new ORPCError("FORBIDDEN", { message: "Insufficient credits" });
```

**Errors in repositories** (`packages/database/src/repositories/`): Use `AppError` + `propagateError()` from `@packages/utils/errors`.

---

## Client-Side Patterns (oRPC + TanStack Query)

```typescript
// Queries — use useSuspenseQuery, NOT useQuery (guarantees data defined)
const { data } = useSuspenseQuery(
   orpc.content.getAll.queryOptions({ input: { teamId } })
);

// Mutations — callbacks go INSIDE mutationOptions()
const mutation = useMutation(
   orpc.content.create.mutationOptions({
      onSuccess: () => { queryClient.invalidateQueries(...) },
   })
);
```

**Rules:**
- `input` goes INSIDE `queryOptions()`, not as a separate argument
- Only use `useQuery` for optional/polling/conditional queries
- Wrap suspense components in `<Suspense fallback={...}>` at route/layout level
- NEVER dynamically import hooks (`await import("@tanstack/react-query")` breaks React rules)

---

## Code Style

**Files:** kebab-case (`content-editor.tsx`, `use-content.ts`)
**Components:** PascalCase `[Feature][Action][Type]` (`ContentEditor`, `AgentSettingsSection`)
**Hooks:** `use[Feature][Action]` (`useContent`, `useCreateContent`)

**No barrel files.** Never create `index.ts` re-exports. Import directly from source files using package.json exports:
```typescript
// Good
import { Button } from "@packages/ui/components/button";
import { emitEvent } from "@packages/events/emit";

// Bad — bypasses exports
import { Button } from "@packages/ui/src/components/button";
import { emitEvent } from "@packages/events";
```

**Biome lint suppression:** Place `// biome-ignore lint/[category]/[rule]: [reason]` directly above the triggering line. For JSX props, place above the prop, not the element.

**Array index keys:** Prefer `key={\`step-${index + 1}\`}` over suppressing `noArrayIndexKey`.

**No dynamic imports.** Never use `await import(...)` for project modules. Always use static `import` at the top of the file. Dynamic imports break tree-shaking and are unnecessary in this codebase.

---

## Package Exports

Packages use explicit `package.json` exports. Always match the export path exactly:

```typescript
// Named: import { createDb } from "@packages/database/client"
// Wildcard: import { content } from "@packages/database/schemas/content"
// Wildcard: import { createContent } from "@packages/database/repositories/content-repository"
```

Common patterns: `.` (root), `./client`, `./server`, `./schemas/*`, `./repositories/*`, `./components/*`

---

## Feature Folder Structure (in apps/web/src/features/)

```
features/[name]/
├── hooks/     use-[feature]-context.tsx, use-[feature]-[action].ts
├── ui/        [feature]-[action]-credenza.tsx, [feature]-section.tsx
└── utils/     (when needed)
```

Features: analytics, billing, content, editor, file-upload, forms, onboarding, organization, personal-api-keys, search, settings

---

## Routes (TanStack Router — file-based)

```
apps/web/src/routes/
├── auth/                  # sign-in, sign-up, forgot-password
├── _authenticated/
│   └── $slug/
│       ├── onboarding.tsx
│       └── $teamId/       # team-scoped dashboard routes
└── api/                   # API routes
```

Conventions: kebab-case files, `$` for dynamic segments, `_` for layout routes.

---

## Database (Drizzle ORM + PostgreSQL)

**Schemas** at `packages/database/src/schemas/`: content, writer, chat, forms, dashboards, insights, events, webhooks, auth, etc.

**Repository pattern** at `packages/database/src/repositories/`:
```typescript
export async function createContent(db: DatabaseInstance, data: NewContent) {
   try {
      const result = await db.insert(content).values(data).returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create content");
   }
}
```

---

## Authentication (Better Auth)

Config at `packages/authentication/src/server.ts`. Plugins: Google OAuth, Magic Link, Email OTP, 2FA, Anonymous sessions.

**Adding fields to auth-managed tables** (`user`, `session`, `organization`, `team`): Use `additionalFields` in Better Auth config, NOT direct Drizzle schema edits.

```typescript
// packages/authentication/src/server.ts
organization({
   schema: {
      team: {
         additionalFields: {
            onboardingProducts: {
               type: "json",
               defaultValue: null,
               validator: { input: z.array(z.enum(["content", "forms", "analytics"])).nullable() },
            },
         },
      },
   },
})
```

Field types: `"string"` (TEXT), `"boolean"` (BOOLEAN), `"number"` (INTEGER), `"string[]"` (TEXT[]), `"json"` (JSONB + Zod validator)

---

## Global UI Hooks (TanStack Store)

| Hook | Purpose | Use For |
|------|---------|---------|
| `useSheet` | Side panel forms | Creating/editing content, agents, brands, invites |
| `useCredenza` | Modal (desktop) / Drawer (mobile) | Selecting agents, export formats |
| `useAlertDialog` | Destructive confirmations | Deleting content, revoking access |

```typescript
const { openSheet, closeSheet } = useSheet();
openSheet({ children: <CreateContentForm onSuccess={closeSheet} /> });
```

---

## Events & Credits (packages/events/)

File-per-category pattern: `content.ts`, `ai.ts`, `forms.ts`, `seo.ts`, `emit.ts`, `credits.ts`

- `emitEvent()` is non-throwing (inner try-catch)
- `enforceCreditBudget()` throws plain Error — wrap as `ORPCError("FORBIDDEN")` in routers
- In generators, emit/track BEFORE final yield (post-yield code may not run)

---

## Scripts

All scripts go in root `scripts/` directory. NEVER in `packages/*/` or `apps/*/`.

Required patterns: `commander` CLI with `run` + `check` commands, `--env` flag, `--dry-run` flag, `chalk` for colored output, env loaded from `packages/database/.env*`.

See existing scripts in `scripts/` for the standard template.

---

## Environment Variables

- SCREAMING_SNAKE_CASE naming
- Validated with Zod in `packages/environment/src/{server,worker}.ts`
- Client-side: `VITE_` prefix
- Env files in `packages/database/` (`.env`, `.env.local`, `.env.production`)

---

## Onboarding (Two Flows)

1. **Organization onboarding** — one-time workspace setup (`organization.onboardingCompleted`)
2. **Project onboarding** — per-team setup (`team.onboardingCompleted`, `team.onboardingProducts`, `team.onboardingTasks`)

Procedures in `apps/web/src/integrations/orpc/router/onboarding.ts`.

---

## Subscription Plans

| Plan | Credits |
|------|---------|
| FREE | R$5 (AI + Platform pools) |
| LITE | R$50 |
| PRO | R$100 |

Credit tracking: Redis real-time, materialized views reconcile hourly (worker cron).
