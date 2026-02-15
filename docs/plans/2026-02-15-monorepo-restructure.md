# Monorepo Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize the Contentta Nx monorepo into explicit architectural layers (`core/`, `packages/`, `apps/`), split the bloated `@packages/events` into three focused packages, enforce module boundaries with Nx tags, and fix all known code smells.

**Architecture:** Introduce a `core/` directory for foundational packages with zero or minimal internal dependencies (utils, environment, logging, redis, queue, database). The existing `packages/` directory becomes the business logic layer built on core. Apps consume both layers. Nx project tags enforce the layering. The `@packages/events` mega-package is split into `@packages/events` (catalog + emission), `@packages/billing` (credits, pricing, reconciliation), and `@packages/webhooks` (dispatch infrastructure).

**Tech Stack:** Nx 22.5, Bun workspaces, TypeScript, Drizzle ORM, oRPC, BullMQ

---

## Phase 1: Foundation — Create `core/` layer and move packages

### Task 1: Update Bun workspaces to include `core/`

**Files:**
- Modify: `package.json` (root, line ~291)

**Step 1: Add `core/*` to workspaces**

In root `package.json`, update the `workspaces.packages` array:

```json
"packages": [
   "tooling/*",
   "libraries/*",
   "core/*",
   "packages/*",
   "apps/*"
]
```

**Step 2: Verify Bun resolves workspaces**

Run: `bun install`
Expected: No errors, lock file updates

**Step 3: Commit**

```bash
git add package.json bun.lock
git commit -m "chore: add core/* to bun workspaces"
```

---

### Task 2: Move foundation packages to `core/`

Move these 6 packages from `packages/` to `core/`:
- `utils` (zero internal deps)
- `environment` (depends on utils only)
- `logging` (zero internal deps)
- `redis` (zero internal deps)
- `queue` (zero internal deps)
- `database` (depends on utils only)

**Files:**
- Move: `packages/{utils,environment,logging,redis,queue,database}` → `core/`
- Modify: `core/*/package.json` (change name prefix from `@packages/` to `@core/`)
- Modify: `tsconfig.json` (root, update references)

**Step 1: Create core directory and move packages**

```bash
mkdir -p core
mv packages/utils core/utils
mv packages/environment core/environment
mv packages/logging core/logging
mv packages/redis core/redis
mv packages/queue core/queue
mv packages/database core/database
```

**Step 2: Rename all 6 packages from `@packages/*` to `@core/*`**

For each moved package, update `package.json` name field:
- `@packages/utils` → `@core/utils`
- `@packages/environment` → `@core/environment`
- `@packages/logging` → `@core/logging`
- `@packages/redis` → `@core/redis`
- `@packages/queue` → `@core/queue`
- `@packages/database` → `@core/database`

**Step 3: Update root `tsconfig.json` references**

```json
{
   "references": [
      { "path": "./core/redis" },
      { "path": "./core/queue" }
   ]
}
```

**Step 4: Update cross-references in moved packages**

- `core/environment/package.json`: `@packages/utils` → `@core/utils`
- `core/database/package.json`: `@packages/utils` → `@core/utils`
- `core/events/tsconfig.json`: update `references` paths from `../redis`, `../queue` to `../../core/redis`, `../../core/queue` (only if the events tsconfig references those — it does)

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move foundation packages to core/ layer"
```

---

### Task 3: Update all imports from `@packages/*` to `@core/*` for moved packages

This is the largest mechanical change. Every file importing from the 6 moved packages needs updating.

**Find all affected imports:**

```bash
# Find all imports to update
rg 'from "@packages/(utils|environment|logging|redis|queue|database)' --type ts -l
```

**Step 1: Bulk rename imports**

For each of the 6 packages, do a project-wide find-and-replace:
- `@packages/utils/` → `@core/utils/`
- `@packages/environment/` → `@core/environment/`
- `@packages/logging/` → `@core/logging/`
- `@packages/redis/` → `@core/redis/`
- `@packages/queue/` → `@core/queue/`
- `@packages/database/` → `@core/database/`

Also update `workspace:*` dependency declarations in every `package.json` that references these:
- `@packages/utils` → `@core/utils`
- etc.

**Step 2: Update internal imports within moved core packages**

- `core/environment/src/server.ts`: any import from `@packages/utils/*` → `@core/utils/*`
- `core/database/src/**/*.ts`: any import from `@packages/utils/*` → `@core/utils/*`

**Step 3: Verify build**

Run: `bun run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: update all imports to @core/ for moved packages"
```

---

### Task 4: Update Nx release config for core/

**Files:**
- Modify: `nx.json` (line ~72)

**Step 1: Add core to release projects**

```json
"release": {
   "projects": ["apps/*", "core/*", "packages/*"]
}
```

**Step 2: Commit**

```bash
git add nx.json
git commit -m "chore: include core/* in Nx release config"
```

---

## Phase 2: Split `@packages/events` into three packages

### Task 5: Create `@packages/billing` package

**Files:**
- Create: `packages/billing/package.json`
- Create: `packages/billing/tsconfig.json`
- Move: `packages/events/src/pricing.ts` → `packages/billing/src/pricing.ts`
- Move: `packages/events/src/credits.ts` → `packages/billing/src/credits.ts`
- Move: `packages/events/src/utils.ts` → `packages/billing/src/event-pricing.ts` (rename for clarity)
- Move: `packages/events/src/refresh-views.ts` → `packages/billing/src/refresh-views.ts`
- Move: `packages/events/src/reconcile.ts` → `packages/billing/src/reconcile.ts`

**Step 1: Create package scaffolding**

`packages/billing/package.json`:
```json
{
   "name": "@packages/billing",
   "version": "0.1.0",
   "type": "module",
   "private": true,
   "license": "Apache-2.0",
   "exports": {
      "./pricing": {
         "default": "./src/pricing.ts",
         "types": "./dist/src/pricing.d.ts"
      },
      "./credits": {
         "default": "./src/credits.ts",
         "types": "./dist/src/credits.d.ts"
      },
      "./event-pricing": {
         "default": "./src/event-pricing.ts",
         "types": "./dist/src/event-pricing.d.ts"
      },
      "./refresh-views": {
         "default": "./src/refresh-views.ts",
         "types": "./dist/src/refresh-views.d.ts"
      },
      "./reconcile": {
         "default": "./src/reconcile.ts",
         "types": "./dist/src/reconcile.d.ts"
      }
   },
   "files": ["dist"],
   "scripts": {
      "build": "tsc --build",
      "check": "biome check --write ./src",
      "test": "bun test --pass-with-no-tests",
      "typecheck": "tsgo"
   },
   "dependencies": {
      "@f-o-t/money": "catalog:fot",
      "@orpc/server": "catalog:orpc",
      "@core/database": "workspace:*",
      "@core/redis": "workspace:*",
      "@packages/events": "workspace:*",
      "@packages/stripe": "workspace:*",
      "drizzle-orm": "catalog:database",
      "ioredis": "catalog:workers",
      "zod": "catalog:validation"
   },
   "devDependencies": {
      "@tooling/typescript": "workspace:*",
      "typescript": "catalog:development"
   }
}
```

`packages/billing/tsconfig.json`:
```json
{
   "extends": "@tooling/typescript/typecheck.json",
   "include": ["src"],
   "references": [
      { "path": "../../core/redis" },
      { "path": "../../core/queue" }
   ]
}
```

**Step 2: Move and adapt billing files**

```bash
mkdir -p packages/billing/src
mv packages/events/src/pricing.ts packages/billing/src/pricing.ts
mv packages/events/src/credits.ts packages/billing/src/credits.ts
mv packages/events/src/utils.ts packages/billing/src/event-pricing.ts
mv packages/events/src/refresh-views.ts packages/billing/src/refresh-views.ts
mv packages/events/src/reconcile.ts packages/billing/src/reconcile.ts
```

**Step 3: Update internal imports within billing files**

In `packages/billing/src/credits.ts`:
- `from "./pricing"` → stays `from "./pricing"` (same package)
- `from "./utils"` → `from "./event-pricing"`

In `packages/billing/src/reconcile.ts`:
- `from "./pricing"` → stays `from "./pricing"` (same package)

In `packages/billing/src/pricing.ts`:
- `from "./ai"` → `from "@packages/events/ai"`
- `from "./content"` → `from "@packages/events/content"`
- `from "./forms"` → `from "@packages/events/forms"`
- `from "./seo"` → `from "@packages/events/seo"`
- `from "./experiments"` → `from "@packages/events/experiments"`
- `from "./webhook"` → `from "@packages/events/webhook"`
- `from "./dashboard"` → `from "@packages/events/dashboard"`
- `from "./insight"` → `from "@packages/events/insight"`
- `from "./catalog"` → `from "@packages/events/catalog"`

All `@packages/database` → `@core/database` and `@packages/redis` → `@core/redis` imports too.

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: extract @packages/billing from events"
```

---

### Task 6: Create `@packages/webhooks` package and refactor emit.ts

**Files:**
- Create: `packages/webhooks/package.json`
- Create: `packages/webhooks/tsconfig.json`
- Create: `packages/webhooks/src/dispatch.ts` (extracted from emit.ts)
- Modify: `packages/events/src/emit.ts` (remove webhook logic, add hook)

**Step 1: Create package scaffolding**

`packages/webhooks/package.json`:
```json
{
   "name": "@packages/webhooks",
   "version": "0.1.0",
   "type": "module",
   "private": true,
   "license": "Apache-2.0",
   "exports": {
      "./dispatch": {
         "default": "./src/dispatch.ts",
         "types": "./dist/src/dispatch.d.ts"
      }
   },
   "files": ["dist"],
   "scripts": {
      "build": "tsc --build",
      "check": "biome check --write ./src",
      "test": "bun test --pass-with-no-tests",
      "typecheck": "tsgo"
   },
   "dependencies": {
      "@core/database": "workspace:*",
      "@core/queue": "workspace:*",
      "bullmq": "catalog:workers"
   },
   "devDependencies": {
      "@tooling/typescript": "workspace:*",
      "typescript": "catalog:development"
   }
}
```

**Step 2: Extract webhook dispatch from emit.ts**

Create `packages/webhooks/src/dispatch.ts` with:
- `initializeWebhookQueue()` — moved from emit.ts
- `buildWebhookPayload()` — moved from emit.ts
- `triggerWebhooksForEvent()` — new public function wrapping the inner try-catch from emit.ts lines 136-179

```typescript
import type { DatabaseInstance } from "@core/database/client";
import {
   createWebhookDelivery,
   findMatchingWebhooks,
} from "@core/database/repositories/webhook-repository";
import { createQueueConnection } from "@core/queue/connection";
import {
   createWebhookDeliveryQueue,
   type WebhookDeliveryJobData,
} from "@core/queue/webhook-delivery";
import type { Queue } from "bullmq";

let webhookQueue: Queue<WebhookDeliveryJobData> | null = null;

export function initializeWebhookQueue(redisUrl: string): void {
   if (webhookQueue) return;
   const connection = createQueueConnection(redisUrl);
   webhookQueue = createWebhookDeliveryQueue(connection);
}

function buildWebhookPayload(
   eventId: string,
   eventName: string,
   organizationId: string,
   properties: Record<string, unknown>,
): Record<string, unknown> {
   return {
      id: eventId,
      event: eventName,
      data: properties,
      created_at: new Date().toISOString(),
      organization_id: organizationId,
   };
}

export async function triggerWebhooksForEvent(
   db: DatabaseInstance,
   eventId: string,
   eventName: string,
   organizationId: string,
   properties: Record<string, unknown>,
): Promise<void> {
   if (!webhookQueue) return;

   try {
      const matchingWebhooks = await findMatchingWebhooks(db, organizationId, eventName);

      for (const webhook of matchingWebhooks) {
         const payload = buildWebhookPayload(eventId, eventName, organizationId, properties);
         const delivery = await createWebhookDelivery(db, {
            webhookEndpointId: webhook.id,
            eventId,
            url: webhook.url,
            eventName,
            payload,
            status: "pending",
            attemptNumber: 1,
            maxAttempts: 5,
         });

         if (!delivery) continue;

         await webhookQueue.add("deliver", {
            deliveryId: delivery.id,
            webhookEndpointId: webhook.id,
            eventId,
            url: webhook.url,
            payload,
            signingSecret: webhook.signingSecret,
            attemptNumber: 1,
         });
      }
   } catch (error) {
      console.error("[Webhooks] Failed to trigger webhooks:", error);
   }
}
```

**Step 3: Simplify emit.ts**

Remove all webhook-related code from `packages/events/src/emit.ts`:
- Remove imports: `createWebhookDelivery`, `findMatchingWebhooks`, `createQueueConnection`, `createWebhookDeliveryQueue`, `WebhookDeliveryJobData`, `Queue`
- Remove: `webhookQueue` variable, `initializeWebhookQueue()`, `buildWebhookPayload()`
- Remove: lines 136-179 (webhook triggering inside emitEvent)
- Add: import `triggerWebhooksForEvent` from `@packages/webhooks/dispatch` and call it after the PostHog capture

Updated `emitEvent()` will call:
```typescript
import { triggerWebhooksForEvent } from "@packages/webhooks/dispatch";
// ... inside emitEvent, after PostHog capture:
await triggerWebhooksForEvent(db, storedEvent.id, eventName, organizationId, properties);
```

Also update `@packages/events/package.json`:
- Remove dependencies: `bullmq`, `@core/queue`
- Add dependency: `@packages/webhooks`
- Remove export: `./utils` (moved to billing as `event-pricing`)
- Remove export: `./refresh-views` (moved to billing)
- Remove export: `./pricing` (moved to billing)
- Remove export: `./credits` (moved to billing)
- Remove export: `./reconcile` (moved to billing)

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: extract @packages/webhooks from events"
```

---

### Task 7: Update all consumer imports for the events split

**Files:**
- Modify: All files importing from `@packages/events/{credits,pricing,utils,refresh-views,reconcile}`
- Modify: All `package.json` files that depend on `@packages/events` for billing features

**Step 1: Update billing imports**

| Old import | New import | Affected files |
|-----------|-----------|----------------|
| `@packages/events/credits` | `@packages/billing/credits` | `router/agent.ts`, `router/content.ts`, `router/organization.ts`, `router/team.ts` |
| `@packages/events/pricing` | `@packages/billing/pricing` | `scripts/seed-event-catalog.ts` |
| `@packages/events/utils` | `@packages/billing/event-pricing` | (internal only — already updated in Task 5) |
| `@packages/events/refresh-views` | `@packages/billing/refresh-views` | `apps/worker/src/jobs/refresh-views.ts` |
| `@packages/events/reconcile` | `@packages/billing/reconcile` | `apps/worker/src/jobs/reconcile-credits.ts` |

**Step 2: Update webhook imports**

| Old import | New import | Affected files |
|-----------|-----------|----------------|
| `initializeWebhookQueue` from `@packages/events/emit` | `initializeWebhookQueue` from `@packages/webhooks/dispatch` | App startup files that called this |

**Step 3: Update package.json dependencies**

- `apps/web/package.json`: Add `@packages/billing`, keep `@packages/events`
- `apps/worker/package.json`: Add `@packages/billing`, `@packages/webhooks`, keep `@packages/events`
- `apps/sdk-server/package.json`: Keep `@packages/events` (only uses catalog/emit/domain events)

**Step 4: Verify build**

Run: `bun run typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: update all imports for events/billing/webhooks split"
```

---

## Phase 3: Enforce boundaries with Nx tags

### Task 8: Add Nx project tags

**Files:**
- Create: `core/*/project.json` (for each core package, to add tags)
- Modify: `nx.json` (add module boundary rules)

**Step 1: Add project.json with tags to each core package**

For each package in `core/`, create `project.json`:

```json
{
   "name": "@core/utils",
   "tags": ["layer:core"]
}
```

Repeat for: `@core/environment`, `@core/logging`, `@core/redis`, `@core/queue`, `@core/database`

**Step 2: Add project.json with tags to each business package**

For each package in `packages/`, create or update `project.json`:

```json
{
   "name": "@packages/events",
   "tags": ["layer:packages"]
}
```

Repeat for all packages: `authentication`, `analytics`, `billing`, `events`, `webhooks`, `agents`, `search`, `files`, `stripe`, `posthog`, `transactional`, `arcjet`, `ui`

**Step 3: Add tags to apps**

For each app in `apps/`, create or update `project.json`:

```json
{
   "name": "web",
   "tags": ["layer:app"]
}
```

Repeat for: `sdk-server`, `worker`

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: add Nx project tags for layer enforcement"
```

---

### Task 9: Configure Nx module boundary rules

**Files:**
- Modify: `biome.json` or create `.eslintrc.json` (for `@nx/enforce-module-boundaries`)

**Note:** Nx module boundaries require `@nx/eslint`. Since the project uses Biome, we have two options:
1. Add a minimal ESLint config ONLY for the Nx boundary rule (recommended — Biome handles formatting/linting, ESLint only handles the Nx-specific rule)
2. Document boundaries as conventions only (no enforcement)

**Step 1: Install the Nx ESLint plugin**

```bash
bun add -D @nx/eslint-plugin eslint
```

**Step 2: Create minimal `.eslintrc.json` at root**

```json
{
   "root": true,
   "plugins": ["@nx"],
   "rules": {
      "@nx/enforce-module-boundaries": [
         "error",
         {
            "depConstraints": [
               {
                  "sourceTag": "layer:core",
                  "onlyDependOnLibsWithTags": ["layer:core"]
               },
               {
                  "sourceTag": "layer:packages",
                  "onlyDependOnLibsWithTags": ["layer:core", "layer:packages"]
               },
               {
                  "sourceTag": "layer:app",
                  "onlyDependOnLibsWithTags": ["layer:core", "layer:packages"]
               }
            ]
         }
      ]
   }
}
```

**Step 3: Add an Nx lint target for boundary checking only**

In `nx.json` add to `targetDefaults`:
```json
"lint": {
   "cache": true,
   "inputs": ["default"]
}
```

Add a root script: `"lint:boundaries": "nx run-many -t lint --parallel=8"`

**Step 4: Verify boundaries**

Run: `bun run lint:boundaries`
Expected: No violations (all current deps follow the layer rules)

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: enforce module boundaries with Nx tags"
```

---

## Phase 4: Fix code smells and cleanup

### Task 10: Fix broken authentication exports

**Files:**
- Modify: `packages/authentication/package.json`

**Step 1: Remove stale exports**

Remove these two exports from `packages/authentication/package.json`:
- `"./redis-connection"` — file was deleted, redis extracted to `@core/redis`
- `"./helpers"` — directory never existed

**Step 2: Update authentication package.json dependencies**

Update `@packages/database` → `@core/database`, `@packages/environment` → `@core/environment`, `@packages/redis` → `@core/redis`, etc.

**Step 3: Commit**

```bash
git add packages/authentication/package.json
git commit -m "fix: remove stale exports from authentication package"
```

---

### Task 11: Resolve DEFAULT_INSIGHTS duplication

**Files:**
- Modify: `packages/analytics/src/default-dashboard.ts` (keep as canonical)
- Modify: `core/database/src/default-insights.ts` (import from analytics instead)
- Modify: `packages/analytics/package.json` (ensure export exists)

**Step 1: Ensure analytics exports the canonical version**

Verify `packages/analytics/package.json` has `"./default-dashboard"` export (it should already).

**Step 2: Replace database copy with re-export**

In `core/database/src/default-insights.ts`, replace the duplicated array with:

```typescript
// Re-export from analytics to avoid duplication.
// Originally moved here to break circular dependency — resolved by
// having analytics depend on database (not vice versa).
export { DEFAULT_INSIGHTS } from "@packages/analytics/default-dashboard";
```

**Important:** Check if database depends on analytics. If adding this import creates a circular dependency (database → analytics → database), then keep the duplication and add a comment explaining why. The analytics package depends on `@core/database`, so this re-export would create a circular dep. In that case:

**Alternative:** Move `DEFAULT_INSIGHTS` to `@core/database` as the canonical source (with proper typing), and have analytics import from there. Update the analytics version to import from `@core/database/default-insights`.

**Step 3: Commit**

```bash
git add -A
git commit -m "fix: resolve DEFAULT_INSIGHTS duplication"
```

---

### Task 12: Fix minor inconsistencies

**Files:**
- Modify: `packages/files/package.json` (fix export naming)
- Modify: All remaining `package.json` files (update `@packages/*` → `@core/*` deps)

**Step 1: Fix files package export naming**

In `packages/files/package.json`, rename:
- `"./text-file-helper"` → `"./text-file-helpers"` (match the actual filename)

**Step 2: Bulk-update all package.json dependency references**

Every package that depends on a core package needs updating:
- `packages/authentication/package.json`: `@packages/database` → `@core/database`, `@packages/environment` → `@core/environment`, `@packages/redis` → `@core/redis`
- `packages/events/package.json`: `@packages/database` → `@core/database`, `@packages/redis` → `@core/redis`, `@packages/queue` → `@core/queue`
- `packages/analytics/package.json`: `@packages/database` → `@core/database`, `@packages/utils` → `@core/utils`
- `packages/agents/package.json`: `@packages/database` → `@core/database`, `@packages/environment` → `@core/environment`, `@packages/utils` → `@core/utils`
- `packages/arcjet/package.json`: `@packages/environment` → `@core/environment`
- `packages/posthog/package.json`: `@packages/environment` → `@core/environment`
- `packages/files/package.json`: `@packages/environment` → `@core/environment`
- `packages/search/package.json`: `@packages/environment` → `@core/environment`, `@packages/utils` → `@core/utils`
- `packages/transactional/package.json`: `@packages/utils` → `@core/utils`
- `packages/ui/package.json`: `@packages/utils` → `@core/utils`
- All `apps/*/package.json`: Update core package references

**Step 3: Run install to update lockfile**

Run: `bun install`

**Step 4: Verify everything builds**

Run: `bun run typecheck && bun run build`
Expected: No errors

**Step 5: Commit**

```bash
git add -A
git commit -m "fix: update all package.json deps and fix naming inconsistencies"
```

---

## Phase 5: Update documentation

### Task 13: Update CLAUDE.md and memory

**Files:**
- Modify: `CLAUDE.md` (root)
- Modify: Memory files

**Step 1: Update CLAUDE.md monorepo structure section**

Replace the structure section with:

```
contentta-nx/
├── core/               # Foundation — zero or minimal internal deps
│   ├── utils/          # Shared utilities + error classes
│   ├── environment/    # Zod-validated env vars
│   ├── logging/        # Pino logger
│   ├── redis/          # Redis singleton
│   ├── queue/          # BullMQ abstractions
│   └── database/       # Drizzle ORM schemas & repositories
├── packages/           # Business logic — built on core
│   ├── authentication/ # Better Auth setup
│   ├── analytics/      # Analytics engine
│   ├── billing/        # Credit pools, pricing, reconciliation
│   ├── events/         # Event catalog, emission, domain events
│   ├── webhooks/       # Webhook dispatch infrastructure
│   ├── agents/         # Mastra AI agents
│   ├── search/         # Web search providers
│   ├── files/          # MinIO & file utilities
│   ├── stripe/         # Stripe SDK wrapper
│   ├── posthog/        # Analytics client
│   ├── transactional/  # Email templates
│   ├── arcjet/         # Rate limiting
│   └── ui/             # Radix + Tailwind components
├── apps/
│   ├── web/            # React/Vite SPA + oRPC routers
│   ├── sdk-server/     # Elysia API server
│   └── worker/         # BullMQ background processor
├── libraries/
│   └── sdk/            # Published TypeScript SDK
└── tooling/
    └── typescript/     # Shared TS configs
```

**Step 2: Update import examples in CLAUDE.md**

Replace `@packages/database` → `@core/database`, etc. throughout the doc.

**Step 3: Add layer rules section**

```markdown
## Layer Rules (Enforced by Nx)

| Layer | Can import from |
|-------|----------------|
| `core/` | Only other `core/` packages |
| `packages/` | `core/` + other `packages/` |
| `apps/` | `core/` + `packages/` |

Tags: `layer:core`, `layer:packages`, `layer:app`
```

**Step 4: Remove outdated notes**

- Remove note about `resolveOrganizationPlan` duplication (it's not duplicated)
- Update events package documentation to reflect the split

**Step 5: Commit**

```bash
git add -A
git commit -m "docs: update CLAUDE.md for new monorepo structure"
```

---

## Final Verification

### Task 14: Full verification pass

**Step 1: Clean install**

```bash
rm -rf node_modules
bun install
```

**Step 2: Type check**

Run: `bun run typecheck`
Expected: No errors

**Step 3: Build**

Run: `bun run build`
Expected: No errors

**Step 4: Tests**

Run: `bun run test`
Expected: All passing

**Step 5: Lint boundaries**

Run: `bun run lint:boundaries`
Expected: No violations

**Step 6: Dev server smoke test**

Run: `bun dev`
Expected: Web app starts without errors

---

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| Directory structure | Flat `packages/` (17 packages) | `core/` (6) + `packages/` (14) |
| `@packages/events` | 15 exports, 5 deps | Split into 3 focused packages |
| Module boundaries | None enforced | Nx tags + ESLint rule |
| Import prefix | `@packages/*` for all | `@core/*` for foundation, `@packages/*` for business |
| Broken exports | 2 in authentication | Removed |
| Code duplication | DEFAULT_INSIGHTS in 2 places | Single source of truth |
