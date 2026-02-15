# Webhooks Settings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement team-scoped webhook endpoint management in settings, including CRUD UI, delivery history, and Better Auth-backed signing secrets.

**Architecture:** Webhook endpoints are scoped to `teamId` with Better Auth API keys used for signing secrets. The settings UI uses DataTable with expandable delivery history, and oRPC handlers validate event subscriptions against the event catalog.

**Tech Stack:** Bun, Nx, React + TanStack Query/Router, oRPC, Drizzle (PostgreSQL), Better Auth, Vitest

---

### Task 1: Update webhook schema to be team-scoped

**Files:**
- Modify: `packages/database/src/schemas/webhooks.ts`

**Step 1: Write the failing test**

Create a repository or router test that expects `teamId` to exist on `WebhookEndpoint` and be required.

**Step 2: Run test to verify it fails**

Run: `bun x vitest run __tests__/integrations/orpc/router/webhooks.test.ts`
Expected: FAIL (missing `teamId` on endpoint).

**Step 3: Write minimal implementation**

```ts
teamId: uuid("team_id")
  .notNull()
  .references(() => team.id, { onDelete: "cascade" }),
apiKeyId: text("api_key_id"),
```

Add indexes for `teamId` and `apiKeyId`, plus relation to `team`.

**Step 4: Run test to verify it passes**

Run: `bun x vitest run __tests__/integrations/orpc/router/webhooks.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/database/src/schemas/webhooks.ts
git commit -m "feat(db): add team-scoped webhook endpoints"
```

---

### Task 2: Make webhook repository team-aware

**Files:**
- Modify: `packages/database/src/repositories/webhook-repository.ts`

**Step 1: Write the failing test**

Add/extend router tests expecting `listWebhookEndpoints` to be called with `teamId`, and `findMatchingWebhooks` to accept an optional `teamId`.

**Step 2: Run test to verify it fails**

Run: `bun x vitest run __tests__/integrations/orpc/router/webhooks.test.ts`
Expected: FAIL (repo signature mismatch).

**Step 3: Write minimal implementation**

```ts
export async function listWebhookEndpoints(db: DatabaseInstance, teamId: string) {
  return db.select().from(webhookEndpoints)
    .where(eq(webhookEndpoints.teamId, teamId))
    .orderBy(desc(webhookEndpoints.createdAt));
}

export async function findMatchingWebhooks(
  db: DatabaseInstance,
  organizationId: string,
  eventName: string,
  teamId?: string,
) {
  return endpoints.filter((endpoint) => ...)
}
```

**Step 4: Run test to verify it passes**

Run: `bun x vitest run __tests__/integrations/orpc/router/webhooks.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/database/src/repositories/webhook-repository.ts
git commit -m "feat(db): scope webhook queries to team"
```

---

### Task 3: Update event emission to use team scope

**Files:**
- Modify: `packages/events/src/emit.ts`

**Step 1: Write the failing test**

Add a test that emits an event with `teamId` and asserts `findMatchingWebhooks` receives that `teamId`.

**Step 2: Run test to verify it fails**

Run: `bun test` (or a targeted events test)
Expected: FAIL (missing teamId argument).

**Step 3: Write minimal implementation**

```ts
const matchingWebhooks = await findMatchingWebhooks(
  db,
  organizationId,
  eventName,
  teamId,
);
```

**Step 4: Run test to verify it passes**

Run: `bun test` (or targeted)
Expected: PASS

**Step 5: Commit**

```bash
git add packages/events/src/emit.ts
git commit -m "feat(events): filter webhooks by team"
```

---

### Task 4: Update oRPC webhooks router for Better Auth keys

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/webhooks.ts`
- Modify: `apps/web/__tests__/integrations/orpc/router/webhooks.test.ts`

**Step 1: Write the failing test**

Add tests for:
- Reject wildcard patterns ("*")
- Reject event names not present in catalog
- Creates Better Auth API key and returns `plaintextSecret`
- Masked secret returned in endpoint object

**Step 2: Run test to verify it fails**

Run: `bun x vitest run __tests__/integrations/orpc/router/webhooks.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
const apiKey = await auth.api.createApiKey({ headers, body: { ... } });
const endpoint = await createWebhookEndpoint(db, {
  organizationId,
  teamId,
  url: input.url,
  description: input.description,
  eventPatterns: input.eventPatterns,
  apiKeyId: apiKey.id,
  signingSecret: apiKey.key,
});
return { endpoint: maskSecret(endpoint), plaintextSecret: apiKey.key };
```

Validate `eventPatterns` using `eventCatalog.list`, and reject any wildcard or unknown events.

**Step 4: Run test to verify it passes**

Run: `bun x vitest run __tests__/integrations/orpc/router/webhooks.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/integrations/orpc/router/webhooks.ts apps/web/__tests__/integrations/orpc/router/webhooks.test.ts
git commit -m "feat(webhooks): team-scoped endpoints with Better Auth secrets"
```

---

### Task 5: Build Webhooks UI (DataTable + delivery history)

**Files:**
- Create: `apps/web/src/features/webhooks/ui/webhooks-table.tsx`
- Create: `apps/web/src/features/webhooks/ui/webhook-deliveries-table.tsx`
- Create: `apps/web/src/features/webhooks/ui/webhook-form.tsx`
- Create: `apps/web/src/features/webhooks/ui/webhook-secret-dialog.tsx`
- Modify: `apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/project/webhooks.tsx`

**Step 1: Write the failing test**

Skip UI tests (per instruction). Instead, ensure the page compiles and manual smoke test after implementation.

**Step 2: Implement UI**

- `WebhooksTable`: DataTable with columns (URL, Status, Events, Last success/failure, Actions). Uses `renderSubComponent` to show delivery history table.
- `WebhookDeliveriesTable`: List deliveries with status badge, event name, HTTP code, deliveredAt, error.
- `WebhookForm`: URL + description + multi-select events (from catalog) + active toggle.
- `WebhookSecretDialog`: show secret once (reuse copy UI pattern).

**Step 3: Hook up data**

- Use `orpc.webhooks.list` and `orpc.webhooks.deliveries` with `useSuspenseQuery`.
- Use mutations for create/update/delete, invalidate list.
- Use `useSheet`, `useCredenza`, `useAlertDialog`.

**Step 4: Manual validation**

Run: `bun dev`
Check the page renders, CRUD works, delivery history loads per row.

**Step 5: Commit**

```bash
git add apps/web/src/features/webhooks apps/web/src/routes/_authenticated/$slug/$teamId/_dashboard/settings/project/webhooks.tsx
git commit -m "feat(webhooks): settings UI for endpoints and deliveries"
```

---

### Task 6: Migrate data (non-prod, drop old data)

**Files:**
- None (schema update handled by Drizzle)

**Step 1: Apply schema changes**

Run: `bun run db:push`
Expected: tables updated with `team_id` and `api_key_id`.

**Step 2: Confirm**

Run: `bun run db:studio` and verify columns exist.

**Step 3: Commit**

No commit needed unless schema migration files are generated.

---

### Task 7: Verification

**Step 1:** Run router tests

`bun x vitest run __tests__/integrations/orpc/router/webhooks.test.ts`

**Step 2:** Optional full checks

`bun run typecheck && bun run check`

**Step 3:** Document any test runner warnings

Note any Vitest runtime warnings in the PR summary.

---

## Notes

- Webhook signing secret is stored for signing and masked in API responses.
- Better Auth API key should be deleted on webhook removal.
- Since app is not in prod, no backfill; old records can be dropped.
