# Phase 1 Week 2: Event Emission & Credit-Based Billing — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.
> **Design:** See `docs/plans/2026-02-06-credit-based-billing-design.md` for the full credit-based billing design.

**Goal:** Add event emission to all existing operations, implement credit-based billing with Redis tracking, and remove the old feature-gating system.

**Architecture:** Instrument existing oRPC routers to emit events. Replace `requireFeature()` with `checkCreditBudget()`. Track usage in Redis with materialized view reconciliation.

**Tech Stack:** oRPC, Elysia, `@packages/events`, `@f-o-t/money`, Redis, Drizzle ORM

---

## Task 1: Add Credit Budget Constants & Pool Definitions

**Files:**
- Modify: `packages/events/src/pricing.ts`

**What to do:**

Add plan credit budget constants using `@f-o-t/money` and pool category mappings to the existing `pricing.ts` file.

```typescript
import { PlanName } from "@packages/stripe/constants";

export type CreditPool = "ai" | "platform";

export const POOL_CATEGORIES: Record<CreditPool, string[]> = {
   ai: ["ai"],
   platform: ["content", "form", "seo", "experiment"],
};

export const PLAN_CREDIT_BUDGETS: Record<PlanName, Record<CreditPool, Money>> = {
   [PlanName.FREE]: { ai: brl("2.500000"), platform: brl("2.500000") },
   [PlanName.LITE]: { ai: brl("25.000000"), platform: brl("25.000000") },
   [PlanName.PRO]: { ai: brl("50.000000"), platform: brl("50.000000") },
};
```

Add a helper to resolve which pool an event category belongs to:

```typescript
export function getCreditPool(eventCategory: string): CreditPool {
   if (POOL_CATEGORIES.ai.includes(eventCategory)) return "ai";
   return "platform";
}
```

**Export:** Add `./pricing` export already exists in `package.json`.

**Commit:**
```bash
git commit -m "feat(events): add credit budget constants and pool definitions

- Add PLAN_CREDIT_BUDGETS with @f-o-t/money for FREE/LITE/PRO
- Add POOL_CATEGORIES mapping (ai, platform)
- Add getCreditPool() helper"
```

---

## Task 2: Implement checkCreditBudget()

**Files:**
- Create: `packages/events/src/credits.ts`
- Modify: `packages/events/package.json` (add `./credits` export)

**What to do:**

Create `credits.ts` with the credit budget checking function. This reads from Redis to check if an organization has remaining credits in a given pool.

```typescript
import type { Redis } from "ioredis";
import { createMoney, parseDecimalToMinorUnits, type Money } from "@f-o-t/money";
import { isGreaterThanOrEqual } from "@f-o-t/money/plugins/operators";
import { PlanName } from "@packages/stripe/constants";
import { PLAN_CREDIT_BUDGETS, type CreditPool } from "./pricing";

const PRICE_SCALE = 6;
const CURRENCY = "BRL";

export interface CheckCreditBudgetParams {
   redis: Redis;
   organizationId: string;
   plan: PlanName;
   pool: CreditPool;
}

/**
 * Check if an organization has remaining credits in the given pool.
 * Reads from Redis counter. Throws if credit is exhausted.
 */
export async function checkCreditBudget(params: CheckCreditBudgetParams): Promise<void> {
   const { redis, organizationId, plan, pool } = params;

   const budget = PLAN_CREDIT_BUDGETS[plan][pool];
   const usedRaw = await redis.get(`credits:${organizationId}:${pool}_used`);
   const usedMinorUnits = BigInt(usedRaw ?? "0");
   const used = createMoney(usedMinorUnits, CURRENCY, PRICE_SCALE);

   if (isGreaterThanOrEqual(used, budget)) {
      const poolLabel = pool === "ai" ? "IA" : "plataforma";
      throw new Error(
         `Seu crédito de ${poolLabel} foi esgotado para este mês. Faça upgrade do seu plano para continuar usando.`
      );
   }
}

/**
 * Increment the usage counter in Redis after an event is emitted.
 * Uses INCRBY with the price in minor units (integer).
 * Sets TTL to end of current month + 1 day buffer if key is new.
 */
export async function incrementCreditUsage(
   redis: Redis,
   organizationId: string,
   pool: CreditPool,
   priceMinorUnits: bigint,
): Promise<void> {
   const key = `credits:${organizationId}:${pool}_used`;
   const newValue = await redis.incrby(key, Number(priceMinorUnits));

   // Set TTL if this is the first increment (key was just created)
   if (newValue === Number(priceMinorUnits)) {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      endOfMonth.setDate(endOfMonth.getDate() + 1); // +1 day buffer
      const ttlSeconds = Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
      await redis.expire(key, ttlSeconds);
   }
}
```

**Package.json export:**
```json
"./credits": {
   "default": "./src/credits.ts",
   "types": "./dist/src/credits.d.ts"
}
```

**Dependencies:** Add `ioredis` to `packages/events/package.json` (or use the type from `@packages/cache`).

**Commit:**
```bash
git commit -m "feat(events): implement credit budget checking with Redis

- Add checkCreditBudget() that reads Redis counters
- Add incrementCreditUsage() for post-event tracking
- Uses @f-o-t/money for precision comparison"
```

---

## Task 3: Remove Feature Gating System

**Files:**
- Delete: `packages/stripe/src/features.ts`
- Modify: `packages/stripe/package.json` (remove `./features` export)
- Modify: `apps/web/src/integrations/orpc/router/agent.ts` (remove `requireFeature()` calls)
- Delete: `apps/web/src/hooks/use-feature-access.ts`
- Delete: `apps/sdk-server/src/utils/feature-gate.ts`
- Modify: Any other files importing from the above

**What to do:**

1. Search codebase for all imports of:
   - `@packages/stripe/features`
   - `useFeatureAccess`
   - `requireFeature`
   - `Feature` (from stripe/features)
   - `PLAN_FEATURES`
   - `planHasFeature`
   - `getMinimumPlanForFeature`
   - `FEATURE_DISPLAY_NAMES`

2. In `agent.ts`, remove the three `requireFeature()` calls:
   - `fimStream`: remove `await requireFeature(context, Feature.FIM)`
   - `editStream`: remove `await requireFeature(context, Feature.QUICK_EDIT)`
   - `chatStream`: remove `await requireFeature(context, Feature.CHAT)`

3. Replace with `checkCreditBudget()` calls (Task 4 handles the actual integration, this task just removes the old system).

4. Delete `packages/stripe/src/features.ts` and remove its export from `packages/stripe/package.json`.

5. Delete `apps/web/src/hooks/use-feature-access.ts`.

6. Delete `apps/sdk-server/src/utils/feature-gate.ts`.

7. Fix all broken imports — remove or replace references.

**Important:** `packages/stripe/src/constants.ts` stays (PlanName, STRIPE_PLANS, STRIPE_ADDONS).

**Commit:**
```bash
git commit -m "refactor: remove feature gating system

- Delete packages/stripe/src/features.ts
- Delete apps/web/src/hooks/use-feature-access.ts
- Delete apps/sdk-server/src/utils/feature-gate.ts
- Remove requireFeature() calls from agent router
- All features now available on all plans (credit-based model)"
```

---

## Task 4: Add Credit Checks to AI Operations + Event Emission

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/agent.ts`

**Context:** The `protectedProcedure` context provides `{ db, posthog?, organizationId, userId }`. Redis needs to be added to the context (or imported from a shared integration).

**What to do:**

1. Add credit budget check before each AI operation (replacing the removed `requireFeature()`):

```typescript
import { checkCreditBudget, incrementCreditUsage } from "@packages/events/credits";
import { emitAiCompletion, emitAiChatMessage } from "@packages/events/ai";
import { getCreditPool } from "@packages/events/pricing";
```

2. In `fimStream`:
   - Before streaming: `await checkCreditBudget({ redis, organizationId, plan, pool: "ai" })`
   - After streaming completes (after the final yield): emit `emitAiCompletion()` with latencyMs
   - After emit: `await incrementCreditUsage(redis, organizationId, "ai", priceMinorUnits)`

3. In `editStream`:
   - Same pattern as `fimStream` — check, execute, emit, increment

4. In `chatStream`:
   - Before streaming: `await checkCreditBudget({ redis, organizationId, plan, pool: "ai" })`
   - After streaming completes: emit `emitAiChatMessage()` with session info
   - After emit: increment credit usage

**Note on token counts:** Mastra streaming doesn't expose token usage. Use `0` for `promptTokens`, `completionTokens`, `totalTokens` for now. Track `latencyMs` from existing `startTime` variable. Use `"openrouter"` as provider. Model name should come from agent config or be hardcoded per agent type.

**Note on plan resolution:** Need a helper to get current org plan from Better Auth subscription (similar to the removed `requireFeature` logic but just returning the `PlanName`). Extract the plan-resolution logic into a shared utility before deleting the old feature-gate code.

**Commit:**
```bash
git commit -m "feat(ai): add credit checks and event emission to AI operations

- Add checkCreditBudget() before FIM, edit, and chat streams
- Emit ai.completion for FIM and edit completions
- Emit ai.chat_message for chat messages
- Increment Redis credit counters after each event"
```

---

## Task 5: Add Event Emission to Content Operations

**Files:**
- Modify: `apps/web/src/integrations/orpc/router/content.ts`

**What to do:**

Import typed helper emitters and add event emission after each content operation. Content events use the "platform" pool. Most content events are non-billable (`content.created`, `content.deleted`), so they don't need credit checks — just emit for tracking.

For billable events (`content.page.published`, `content.page.updated`, `content.exported`), add credit check before and increment after.

```typescript
import {
   emitContentCreated,
   emitContentUpdated,
   emitContentPublished,
   emitContentDeleted,
} from "@packages/events/content";
```

1. **create** — emit `emitContentCreated()` after successful creation (non-billable, no credit check)
2. **update** — emit `emitContentUpdated()` after update with `changedFields` (billable, check platform pool)
3. **publish** — emit `emitContentPublished()` after publish with title, slug, wordCount (billable, check platform pool)
4. **remove** — emit `emitContentDeleted()` after deletion (non-billable, no credit check)

Context provides `{ db, posthog, organizationId, userId }` from `protectedProcedure` — destructure all four.

**Commit:**
```bash
git commit -m "feat(content): add event emission to content operations

- Emit content.created on create (non-billable)
- Emit content.page.updated on update
- Emit content.page.published on publish
- Emit content.deleted on delete (non-billable)
- Credit check for billable content events"
```

---

## Task 6: Add Reconciliation Job

**Files:**
- Create: `packages/events/src/reconcile.ts`
- Modify: `packages/events/package.json` (add `./reconcile` export)

**What to do:**

Create a reconciliation function that syncs Redis counters with the materialized view data. This should be called hourly after `refreshUsageViews()`.

```typescript
/**
 * Reconcile Redis credit counters with materialized view data.
 * Called hourly after refreshUsageViews().
 *
 * 1. Query current_month_usage_by_category for all orgs
 * 2. Sum costs by pool (ai vs platform) using POOL_CATEGORIES
 * 3. SET Redis counters to match (overwrite, not increment)
 */
export async function reconcileCreditCounters(
   db: DatabaseInstance,
   redis: Redis,
): Promise<void>
```

Uses `@f-o-t/money` `parseDecimalToMinorUnits()` to convert the materialized view's `month_to_date_cost` (decimal string) to minor units for Redis.

**Commit:**
```bash
git commit -m "feat(events): add Redis credit counter reconciliation

- Sync Redis counters with materialized view data hourly
- Corrects drift from crashes or missed increments
- Uses @f-o-t/money for precision conversion"
```

---

## Task 7: Update Plans Page Copy

**Files:**
- Modify: `apps/web/src/routes/_authenticated/$slug/_dashboard/plans.tsx`
- Modify: `packages/stripe/src/constants.ts` (update STRIPE_PLANS feature descriptions)

**What to do:**

1. Update `STRIPE_PLANS` feature descriptions to reflect credit-based model:
   - Remove feature-gating language ("Autocompletar com IA", "Chat com IA")
   - Replace with usage language ("R$5 em créditos/mês", "R$50 em créditos/mês", "R$100 em créditos/mês")
   - Add "Todos os recursos incluídos" to every plan
   - Differentiate plans by credit amount, not features

2. Update plans page UI:
   - Remove any `useFeatureAccess()` references (already deleted in Task 3)
   - Show credit amounts prominently
   - Add usage indicators if possible (how much of each pool used this month)

**Commit:**
```bash
git commit -m "feat(ui): update plans page to credit-based model

- Update plan descriptions to show credit amounts
- Remove feature-gating language
- All plans now show 'all features included'"
```

---

## Task 8: Verify End-to-End

**Steps:**

1. Start the app: `bun dev`
2. Verify no TypeScript errors: `bun run typecheck`
3. As FREE user:
   - Use FIM completion — should work (previously blocked)
   - Use chat — should work (previously blocked)
   - Trigger enough AI events to exhaust R$2.50 budget
   - Next AI action should be blocked with credit exhausted message
4. Check Redis: `credits:{orgId}:ai_used` should show accumulated minor units
5. Check events table: events should be recorded with correct pricing
6. Run materialized view refresh
7. Run reconciliation — Redis counters should match view totals
8. Check plans page — should show credit-based copy

---

## Week 2 Checklist

- [ ] Credit budget constants with `@f-o-t/money` in pricing.ts
- [ ] `checkCreditBudget()` and `incrementCreditUsage()` with Redis
- [ ] Feature gating system removed entirely
- [ ] AI operations: credit checks + event emission
- [ ] Content operations: event emission
- [ ] Reconciliation job for Redis ↔ materialized view sync
- [ ] Plans page updated to credit-based copy
- [ ] End-to-end verification

**Week 2 Complete!**

Continue to [Phase 1 Week 3: Webhook System](./2026-02-05-phase1-week3-webhooks.md)
