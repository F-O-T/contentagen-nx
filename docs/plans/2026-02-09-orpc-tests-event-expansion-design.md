# oRPC Handler Tests + Event System Expansion

**Date:** 2026-02-09
**Approach:** Interleaved per-router — write tests AND fix faults in the same pass

---

## Problem Statement

The web app has **86 oRPC procedures** across 17 router files with only **1 tested procedure**. An audit revealed:

- **No audit events** for webhooks, forms, dashboards, insights CRUD operations
- **3x duplicated** `resolveOrganizationPlan` helper across `agent.ts`, `content.ts`, `organization.ts`
- **8 console.log/error** statements left in production code
- **No `teamId`** (project) scoping on events — needed for upcoming audit module
- **Missing `content.archived`** event

---

## Part 1: Event System Expansion

### 1.1 Database Migration

Add `team_id` column to `events` table:

```sql
ALTER TABLE events ADD COLUMN team_id UUID REFERENCES team(id) ON DELETE SET NULL;
CREATE INDEX events_team_time_idx ON events (team_id, timestamp);
```

Nullable for backward compatibility with existing rows.

### 1.2 oRPC Context

`withOrganization` middleware in `server.ts` extracts `activeTeamId` from the session and adds it to context:

```typescript
export interface ORPCContextWithOrganization extends ORPCContextAuthenticated {
  organizationId: string;
  teamId: string | null; // from session.session.activeTeamId
}
```

### 1.3 `emitEvent` Signature

`EmitEventParams` gains optional `teamId?: string`. The function passes it to the `events` INSERT. All emit helper `ctx` pick types add `teamId`.

### 1.4 New Event Categories

Add to `EVENT_CATEGORIES` in `packages/events/src/catalog.ts`:

```typescript
export const EVENT_CATEGORIES = {
  // ...existing
  dashboard: "dashboard",
  insight: "insight",
} as const;
```

### 1.5 New Events (15 total)

#### Webhook events (`packages/events/src/webhook.ts` — new file)

| Event | Billable | Properties |
|-------|----------|------------|
| `webhook.endpoint.created` | No (unlimited) | `endpointId, url` |
| `webhook.endpoint.updated` | No (unlimited) | `endpointId, changedFields` |
| `webhook.endpoint.deleted` | No (unlimited) | `endpointId` |
| `webhook.delivered` | Yes (R$0.000500, free tier: 500) | `endpointId, eventName, statusCode` |

#### Form events (add to `packages/events/src/forms.ts`)

| Event | Billable | Properties |
|-------|----------|------------|
| `form.created` | No (unlimited) | `formId, name` |
| `form.updated` | No (unlimited) | `formId, changedFields` |
| `form.deleted` | No (unlimited) | `formId` |

#### Dashboard events (`packages/events/src/dashboard.ts` — new file)

| Event | Billable | Properties |
|-------|----------|------------|
| `dashboard.created` | No (unlimited) | `dashboardId, name` |
| `dashboard.updated` | No (unlimited) | `dashboardId, changedFields` |
| `dashboard.deleted` | No (unlimited) | `dashboardId` |

#### Insight events (`packages/events/src/insight.ts` — new file)

| Event | Billable | Properties |
|-------|----------|------------|
| `insight.created` | No (unlimited) | `insightId, name` |
| `insight.updated` | No (unlimited) | `insightId, changedFields` |
| `insight.deleted` | No (unlimited) | `insightId` |

#### Content events (add to `packages/events/src/content.ts`)

| Event | Billable | Properties |
|-------|----------|------------|
| `content.archived` | No (unlimited) | `contentId` |

### 1.6 Pool Mapping Update

In `packages/events/src/pricing.ts`:

```typescript
export const POOL_CATEGORIES: Record<CreditPool, EventCategory[]> = {
  ai: [EVENT_CATEGORIES.ai],
  platform: [
    EVENT_CATEGORIES.content,
    EVENT_CATEGORIES.form,
    EVENT_CATEGORIES.seo,
    EVENT_CATEGORIES.experiment,
    EVENT_CATEGORIES.dashboard,  // new
    EVENT_CATEGORIES.insight,    // new
    EVENT_CATEGORIES.webhook,    // new
  ],
};
```

### 1.7 Billing UI

Non-billable events display as **"unlimited"** in the usage breakdown.

### 1.8 Files Changed

| File | Action |
|------|--------|
| `packages/database/src/schemas/events.ts` | Add `team_id` column + index |
| `packages/events/src/catalog.ts` | Add `dashboard`, `insight` categories |
| `packages/events/src/webhook.ts` | **New** — 4 events + schemas + emit helpers |
| `packages/events/src/dashboard.ts` | **New** — 3 events + schemas + emit helpers |
| `packages/events/src/insight.ts` | **New** — 3 events + schemas + emit helpers |
| `packages/events/src/forms.ts` | Add 3 CRUD events + emit helpers |
| `packages/events/src/content.ts` | Add `content.archived` event + emit helper |
| `packages/events/src/pricing.ts` | 15 new `EVENT_PRICING` entries + pool mapping |
| `packages/events/src/emit.ts` | `teamId` in params + INSERT |
| `packages/events/package.json` | Add `./webhook`, `./dashboard`, `./insight` exports |
| `apps/web/src/integrations/orpc/server.ts` | `teamId` in context |

---

## Part 2: Shared Helper Extraction + Router Fixes

### 2.1 Extract `resolveOrganizationPlan`

Move to `packages/events/src/credits.ts` (already has `checkCreditBudget` and `incrementCreditUsage`).

Also extract the `enforceCreditBudget` and `enforcePlatformCreditBudget` ORPCError wrappers as shared helpers:

```typescript
// packages/events/src/credits.ts

export async function resolveOrganizationPlan(
  db: DatabaseInstance,
  organizationId: string,
): Promise<PlanName>

export async function enforceCreditBudget(
  db: DatabaseInstance,
  organizationId: string,
  pool: CreditPool,
): Promise<void>
// Resolves plan, checks Redis, throws ORPCError("FORBIDDEN") if exhausted

export async function trackCreditUsage(
  db: DatabaseInstance,
  eventName: string,
  organizationId: string,
  pool: CreditPool,
): Promise<void>
// Gets price, increments Redis counter
```

This removes ~30 duplicated lines from each of the 3 router files.

**Note:** `enforceCreditBudget` throws `ORPCError` directly. This couples `@packages/events` to `@orpc/server`. If that's undesirable, keep the wrappers in a shared file within `apps/web` instead. Alternatively, `credits.ts` can throw a plain `Error` and each router wraps it — but that's the current pattern and it's already proven fragile (3 identical wrappers). Throwing `ORPCError` directly is simpler.

### 2.2 Router Fixes

**`content.ts`:**
- Remove duplicated helpers → import from `@packages/events/credits`
- Remove 3 `console.log` debug statements from `update` handler
- Add `content.archived` event emission to `archive` handler
- Wire `teamId` from context into all emit calls

**`agent.ts`:**
- Remove duplicated helpers → import from `@packages/events/credits`
- Wire `teamId` into emit calls

**`organization.ts`:**
- Remove duplicated `resolveOrganizationPlan` → import from shared

**`webhooks.ts`:**
- Add audit event emissions: `webhook.endpoint.created/updated/deleted`
- Wire `teamId`

**`forms.ts`:**
- Add audit event emissions: `form.created/updated/deleted`
- Wire `teamId`

**`dashboards.ts`:**
- Add audit event emissions: `dashboard.created/updated/deleted`
- Wire `teamId`

**`insights.ts`:**
- Add audit event emissions: `insight.created/updated/deleted`
- Wire `teamId`

**`billing.ts`:**
- Remove 5 `console.error` statements (errors are already thrown as ORPCError)

### 2.3 Credit Enforcement Clarification

Only **billable** mutations get `enforceCreditBudget` before the operation:
- `content.update` — already enforced
- `content.publish` — already enforced
- `webhook.delivered` — already happens in the worker, not in router

Audit-only events emit **after** the operation succeeds, wrapped in failure-tolerant try-catch (existing pattern).

### 2.4 Redis Null Bypass

`if (!redis) return` is **correct by design**. Redis is a fast counter cache; the database (`events` table + materialized views) is the billing source of truth. Hourly reconciliation corrects any drift. No change needed.

---

## Part 3: Test Infrastructure

### 3.1 Shared Test Context

**`apps/web/__tests__/helpers/create-test-context.ts`**

```typescript
export const TEST_USER_ID = "user-00000000-0000-0000-0000-000000000000";
export const TEST_ORG_ID  = "org-00000000-0000-0000-0000-000000000000";
export const TEST_TEAM_ID = "team-00000000-0000-0000-0000-000000000000";

export function createTestContext(overrides?: Partial<ORPCContextWithOrganization>)
// Returns: authenticated user + active org + active team + mock db/auth/posthog

export function createUnauthenticatedContext()
// Returns: session: null (middleware rejects with UNAUTHORIZED)

export function createNoOrgContext()
// Returns: authenticated but no activeOrganizationId (middleware rejects with FORBIDDEN)
```

`db` is a mock object. Each test file mocks specific repository modules via `vi.mock()`.
`auth` is a mock with `api` methods.
`posthog` is a mock with `capture`.
`stripeClient` is a mock (billing tests only).

### 3.2 Middleware Tests

**`apps/web/__tests__/helpers/middleware.test.ts`** — 3 tests:

1. UNAUTHORIZED when session is null
2. FORBIDDEN when activeOrganizationId is missing
3. Passes when both are valid

### 3.3 Per-Router Test Pattern

```typescript
import { call } from "@orpc/server";
import { createTestContext, TEST_ORG_ID } from "../../helpers/create-test-context";

vi.mock("@packages/database/repositories/[feature]-repository");
vi.mock("@packages/events/[category]");

beforeEach(() => vi.clearAllMocks());

// Happy path
it("creates [thing]", async () => {
  vi.mocked(createThing).mockResolvedValueOnce({ id: "1", organizationId: TEST_ORG_ID });
  const result = await call(procedure, input, { context: createTestContext() });
  expect(result).toMatchObject({ id: "1" });
});

// Org isolation
it("returns NOT_FOUND for different org", async () => {
  vi.mocked(getThing).mockResolvedValueOnce({ id: "1", organizationId: "other-org" });
  await expect(call(procedure, { id: "1" }, { context: createTestContext() }))
    .rejects.toThrow("NOT_FOUND");
});

// Audit event emission
it("emits audit event with teamId", async () => {
  vi.mocked(createThing).mockResolvedValueOnce({ id: "1", organizationId: TEST_ORG_ID });
  await call(procedure, input, { context: createTestContext() });
  expect(vi.mocked(emitThingCreated)).toHaveBeenCalledWith(
    expect.objectContaining({ teamId: TEST_TEAM_ID }),
    expect.any(Object),
  );
});

// Event failure tolerance
it("succeeds even when event emission fails", async () => {
  vi.mocked(createThing).mockResolvedValueOnce({ id: "1", organizationId: TEST_ORG_ID });
  vi.mocked(emitThingCreated).mockRejectedValueOnce(new Error("emit failed"));
  const result = await call(procedure, input, { context: createTestContext() });
  expect(result).toMatchObject({ id: "1" });
});
```

### 3.4 Special Test Patterns

**Streaming (agent.ts, chat.ts):**
- Mock `mastra.getAgent()` → mock agent with `.stream()` returning async iterable
- Collect chunks via `for await (const chunk of call(...))`
- Verify credit enforcement before streaming starts
- Verify event emission happens before final yield

**Billing (billing.ts):**
- Mock `stripeClient` on context
- No stripeClient → INTERNAL_SERVER_ERROR
- No stripeCustomerId → returns empty/null
- Happy paths with mapped response shapes

**Session (session.ts):**
- `getSession` uses `publicProcedure` — test with null session (should succeed)
- Protected procedures reject unauthenticated

**Account (account.ts):**
- Mock `auth.api` methods
- Verify catch-and-return-default behavior

---

## Part 4: Execution Phases

### Phase 0: Test Infrastructure
1. Create `apps/web/__tests__/helpers/create-test-context.ts`
2. Create `apps/web/__tests__/helpers/middleware.test.ts`
3. Verify: `npx vitest run apps/web/__tests__/helpers/`

### Phase 1: Event System Expansion
1. Database migration: `team_id` on events table
2. `packages/events/src/catalog.ts` — add categories
3. `packages/events/src/webhook.ts` — new file
4. `packages/events/src/dashboard.ts` — new file
5. `packages/events/src/insight.ts` — new file
6. `packages/events/src/forms.ts` — add CRUD events
7. `packages/events/src/content.ts` — add `content.archived`
8. `packages/events/src/pricing.ts` — 15 new entries + pool mapping
9. `packages/events/src/emit.ts` — add `teamId`
10. `packages/events/package.json` — add exports
11. Seed: `bun run seed:events`
12. Verify: `bun run typecheck`

### Phase 2: Shared Helper Extraction
1. Move `resolveOrganizationPlan` + `enforceCreditBudget` + `trackCreditUsage` to `packages/events/src/credits.ts`
2. Update `packages/events/package.json` exports
3. `apps/web/src/integrations/orpc/server.ts` — add `teamId` to context
4. Verify: `bun run typecheck`

### Phase 3: Router Fixes + Tests (interleaved, one router at a time)

Order by priority:

| Order | Router | Fix | Test file | ~Tests |
|-------|--------|-----|-----------|--------|
| 1 | `content.ts` | Remove dupes, console.logs, add archived event, wire teamId | `content.test.ts` | 18 |
| 2 | `agent.ts` | Remove dupes, wire teamId | `agent.test.ts` | 12 |
| 3 | `webhooks.ts` | Add audit events, wire teamId | `webhooks.test.ts` | 14 |
| 4 | `forms.ts` | Add audit events, wire teamId | `forms.test.ts` | 14 |
| 5 | `billing.ts` | Remove console.errors | `billing.test.ts` | 12 |
| 6 | `organization.ts` | Remove dupe helper | `organization.test.ts` | 12 |
| 7 | `dashboards.ts` | Add audit events, wire teamId | `dashboards.test.ts` | 14 |
| 8 | `insights.ts` | Add audit events, wire teamId | `insights.test.ts` | 12 |
| 9 | `onboarding.ts` | Wire teamId | `onboarding.test.ts` | 14 |
| 10 | `session.ts` | — | `session.test.ts` | 8 |
| 11 | `account.ts` | — | `account.test.ts` | 6 |
| 12 | `chat.ts` | Wire teamId | `chat.test.ts` | 4 |
| 13 | `content-analytics.ts` | — | `content-analytics.test.ts` | 5 |
| 14 | `sdk-usage.ts` | — | `sdk-usage.test.ts` | 3 |
| 15 | `usage.ts` | — | `usage.test.ts` | 2 |
| 16 | `api-keys.ts` | — | `api-keys.test.ts` | 4 |

Per-router verification: `npx vitest run apps/web/__tests__/integrations/orpc/router/[file].test.ts`

### Phase 4: Full Suite Verification
1. `bun run test` — all tests pass
2. `bun run typecheck` — no type errors
3. `bun run check` — no lint errors

---

## Final File Tree

```
packages/events/src/
  catalog.ts            (modified — 2 new categories)
  content.ts            (modified — content.archived)
  forms.ts              (modified — 3 CRUD events)
  webhook.ts            (new — 4 events)
  dashboard.ts          (new — 3 events)
  insight.ts            (new — 3 events)
  pricing.ts            (modified — 15 entries + pool mapping)
  credits.ts            (modified — shared resolveOrganizationPlan + enforce + track)
  emit.ts               (modified — teamId support)

packages/database/src/schemas/
  events.ts             (modified — team_id column)

apps/web/src/integrations/orpc/
  server.ts             (modified — teamId in context)
  router/content.ts     (modified)
  router/agent.ts       (modified)
  router/organization.ts(modified)
  router/webhooks.ts    (modified)
  router/forms.ts       (modified)
  router/dashboards.ts  (modified)
  router/insights.ts    (modified)
  router/billing.ts     (modified)
  router/chat.ts        (modified)
  router/onboarding.ts  (modified)

apps/web/__tests__/
  helpers/
    create-test-context.ts
    middleware.test.ts
  integrations/orpc/router/
    account.test.ts
    agent.test.ts
    api-keys.test.ts
    billing.test.ts
    chat.test.ts
    content.test.ts
    content-analytics.test.ts
    dashboards.test.ts
    forms.test.ts
    insights.test.ts
    onboarding.test.ts
    organization.test.ts
    sdk-usage.test.ts
    session.test.ts
    usage.test.ts
    webhooks.test.ts
```

## Totals

- **15 new events** + 2 new categories + pool mapping update
- **1 database migration** (team_id on events)
- **1 shared helper extraction** (resolveOrganizationPlan + enforce + track)
- **11 router fixes** (duplication, console.logs, audit events, teamId wiring)
- **16 test files** + 1 helper + 1 middleware test = **~157 tests**
- **0 real I/O** in tests — all mocked
