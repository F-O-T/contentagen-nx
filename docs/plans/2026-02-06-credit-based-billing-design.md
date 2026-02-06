# Credit-Based Billing Design

> **Date:** 2026-02-06
> **Status:** Approved
> **Replaces:** Feature-gating subscription model (FREE/LITE/PRO with `requireFeature()`)

---

## Philosophy

Every feature is available to every user on every plan. No feature gates. The only difference between plans is **how much you can use**. This is developer-friendly: users can evaluate the full product before deciding to pay, and the upgrade path is natural ("I need more") rather than artificial ("I need to unlock this").

---

## Credit Pools

Two pools per organization, reset monthly. Values use `@f-o-t/money` with BRL currency and scale 6 (matching `pricePerEvent` precision).

| Pool | Covers | FREE | LITE (R$50) | PRO (R$100) |
|------|--------|------|-------------|-------------|
| **AI** | `ai.completion`, `ai.chat_message`, `ai.agent_action` | R$2.50 | R$25.00 | R$50.00 |
| **Platform** | All other billable events (content, forms, SEO, experiments) | R$2.50 | R$25.00 | R$50.00 |
| **Total** | | **R$5.00** | **R$50.00** | **R$100.00** |

Each event deducts its `pricePerEvent` (defined in `pricing.ts`) from the relevant pool. Non-billable events (`isBillable: false`) are tracked but never deduct.

### Hard Cutoff

When a pool reaches zero the action is blocked with a clear message:

```
"Seu crédito de IA foi esgotado para este mês.
 Faça upgrade do seu plano para continuar usando."
```

No surprise charges, no overages.

### Pool Categories

```typescript
ai:       ["ai"]
platform: ["content", "form", "seo", "experiment"]
```

---

## What Gets Removed

The entire `requireFeature()` system:

- **Delete:** `packages/stripe/src/features.ts` — `Feature` enum, `PLAN_FEATURES`, `planHasFeature()`, `getMinimumPlanForFeature()`, `FEATURE_DISPLAY_NAMES`
- **Delete:** `apps/web/src/hooks/use-feature-access.ts` — frontend feature gating hook
- **Delete:** `apps/sdk-server/src/utils/feature-gate.ts` — SDK feature gating
- **Remove from** `apps/web/src/integrations/orpc/router/agent.ts` — all `requireFeature()` calls
- **Remove from** any other file that imports `requireFeature()`, `useFeatureAccess()`, `Feature`, `PLAN_FEATURES`, `planHasFeature`, or `getMinimumPlanForFeature`

## What Stays

- `packages/stripe/src/constants.ts` — `PlanName` enum, `STRIPE_PLANS` (pricing page UI), `STRIPE_ADDONS`
- Better Auth Stripe plugin — subscription lifecycle (checkout, cancel, renew)
- Plans page UI — copy changes from "unlock features" to "get more usage"

## What Gets Added

- **Credit budget constants** in `packages/events/src/pricing.ts` using `@f-o-t/money`
- **`checkCreditBudget()`** — replaces `requireFeature()`, reads from Redis
- **Redis credit counters** — real-time usage tracking per org per pool
- **Reconciliation job** — hourly sync between Redis and materialized views

---

## Enforcement Flow

```
User triggers action (e.g., FIM completion)
  → checkCreditBudget(): READ from Redis
      → HGET credits:{orgId} ai_used
      → Compare against plan's AI pool budget (from @f-o-t/money)
      → If exceeded: throw ORPCError with credit exhausted message
  → Execute the action (call Mastra agent, etc.)
  → DB transaction:
      → INSERT into events table (with pricePerEvent)
  → After commit:
      → HINCRBY credits:{orgId} ai_used {priceInMinorUnits}
      → Redis key TTL set to end of billing cycle
```

The credit check happens *before* the action, the deduction *after*. Small race window is acceptable — worst case a user gets a few extra events beyond their limit.

---

## Redis Key Schema

```
credits:{organizationId}:ai_used       → integer (minor units, scale 6)
credits:{organizationId}:platform_used  → integer (minor units, scale 6)
```

TTL set to end of current billing cycle (last day of month + 1 day buffer).

---

## Reconciliation (Hourly Cron)

```
→ Refresh materialized views (existing refreshUsageViews())
→ For each org with usage this month:
    → Read current_month_usage_by_category from materialized view
    → Sum AI categories → set Redis ai_used counter
    → Sum platform categories → set Redis platform_used counter
→ Corrects drift from crashes, restarts, or missed increments
```

---

## Plan Budget Constants (`pricing.ts`)

Uses `@f-o-t/money` with `brl()` helper (already exists in pricing.ts):

```typescript
export const PLAN_CREDIT_BUDGETS = {
  [PlanName.FREE]: { ai: brl("2.500000"), platform: brl("2.500000") },
  [PlanName.LITE]: { ai: brl("25.000000"), platform: brl("25.000000") },
  [PlanName.PRO]:  { ai: brl("50.000000"), platform: brl("50.000000") },
} as const;

export type CreditPool = "ai" | "platform";

export const POOL_CATEGORIES: Record<CreditPool, string[]> = {
  ai: ["ai"],
  platform: ["content", "form", "seo", "experiment"],
};
```

---

## `checkCreditBudget()` Signature

Replaces `requireFeature()` in the same call sites:

```typescript
// Before:
await requireFeature(context, Feature.FIM);

// After:
await checkCreditBudget({ redis, db, organizationId, pool: "ai" });
```

Function:
1. Read org's current plan from Better Auth subscription (or default FREE)
2. Get pool budget from `PLAN_CREDIT_BUDGETS` using `@f-o-t/money`
3. Read current usage from Redis (`HGET credits:{orgId} {pool}_used`)
4. Convert Redis integer back to Money, compare with budget
5. If usage >= budget → throw with credit exhausted message

---

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Credit check (Redis GET) | ~1ms | No DB query per request |
| Event emission (DB INSERT) | ~5ms | Inside Drizzle transaction |
| Credit increment (Redis HINCRBY) | ~1ms | After DB commit |
| Reconciliation (hourly) | ~100ms | Materialized view refresh + Redis sync |
