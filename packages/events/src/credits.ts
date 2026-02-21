import { createMoney, greaterThanOrEqual } from "@f-o-t/money";
import { ORPCError } from "@orpc/server";
import type { DatabaseInstance } from "@packages/database/client";
import { subscription } from "@packages/database/schemas/auth";
import { getRedisConnection } from "@packages/redis/connection";
import { PlanName } from "@packages/stripe/constants";
import { and, eq, or } from "drizzle-orm";
import type { Redis } from "ioredis";
import { type CreditPool, PLAN_CREDIT_BUDGETS } from "./pricing";
import { getEventPrice } from "./utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRICE_SCALE = 6;
const CURRENCY = "BRL";

const POOL_DISPLAY_NAMES: Record<CreditPool, string> = {
   ai: "IA",
   platform: "plataforma",
};

// ---------------------------------------------------------------------------
// Redis Key Helpers
// ---------------------------------------------------------------------------

function creditKey(organizationId: string, pool: CreditPool): string {
   return `credits:${organizationId}:${pool}_used`;
}

// ---------------------------------------------------------------------------
// Credit Budget Check
// ---------------------------------------------------------------------------

export interface CheckCreditBudgetParams {
   redis: Redis;
   organizationId: string;
   plan: PlanName;
   pool: CreditPool;
}

/**
 * Checks whether an organization has remaining credits in the given pool.
 * Throws an error (in Portuguese) if the budget is exhausted.
 */
export async function checkCreditBudget(
   params: CheckCreditBudgetParams,
): Promise<void> {
   const { redis, organizationId, plan, pool } = params;

   const budget = PLAN_CREDIT_BUDGETS[plan][pool];

   const raw = await redis.get(creditKey(organizationId, pool));
   if (raw === null) {
      return;
   }

   const used = createMoney(BigInt(raw), CURRENCY, PRICE_SCALE);

   if (greaterThanOrEqual(used, budget)) {
      const poolName = POOL_DISPLAY_NAMES[pool];
      throw new Error(
         `Seu crédito de ${poolName} foi esgotado para este mês. Faça upgrade do seu plano para continuar usando.`,
      );
   }
}

// ---------------------------------------------------------------------------
// Credit Usage Increment
// ---------------------------------------------------------------------------

/**
 * Returns the number of milliseconds until the end of the current month
 * plus one extra day (buffer for timezone edge cases).
 */
function msUntilEndOfMonth(): number {
   const now = new Date();
   const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
   const endOfMonthPlusOneDay = new Date(
      endOfMonth.getTime() + 24 * 60 * 60 * 1000,
   );
   return endOfMonthPlusOneDay.getTime() - now.getTime();
}

/**
 * Increments the credit usage counter for an organization in a given pool.
 * Automatically sets a TTL (end of month + 1 day) on first increment.
 *
 * @param redis - Redis client instance
 * @param organizationId - The organization whose credits to increment
 * @param pool - The credit pool ("ai" or "platform")
 * @param priceMinorUnits - Amount to increment in minor units (scale-6 integer)
 */
export async function incrementCreditUsage(
   redis: Redis,
   organizationId: string,
   pool: CreditPool,
   priceMinorUnits: number,
): Promise<void> {
   const key = creditKey(organizationId, pool);

   const newValue = await redis.incrby(key, priceMinorUnits);

   // If this is the first increment, set TTL to end of month + 1 day
   if (newValue === priceMinorUnits) {
      const ttlMs = msUntilEndOfMonth();
      await redis.pexpire(key, ttlMs);
   }
}

// ---------------------------------------------------------------------------
// Resolve Organization Plan
// ---------------------------------------------------------------------------

const VALID_PLAN_NAMES = new Set<string>(Object.values(PlanName));

/**
 * Looks up the active subscription for an organization and returns its plan.
 * Falls back to FREE if no active/trialing subscription is found.
 */
export async function resolveOrganizationPlan(
   db: DatabaseInstance,
   organizationId: string,
): Promise<PlanName> {
   const [sub] = await db
      .select({ plan: subscription.plan })
      .from(subscription)
      .where(
         and(
            eq(subscription.referenceId, organizationId),
            or(
               eq(subscription.status, "active"),
               eq(subscription.status, "trialing"),
            ),
         ),
      )
      .limit(1);

   if (!sub || !VALID_PLAN_NAMES.has(sub.plan)) {
      return PlanName.FREE;
   }

   return sub.plan as PlanName;
}

// ---------------------------------------------------------------------------
// Enforce Credit Budget (convenience wrapper)
// ---------------------------------------------------------------------------

/**
 * Resolves the org plan, checks the credit budget, and throws an ORPCError
 * if the budget is exhausted. Safe to call when Redis is unavailable (no-op).
 */
export async function enforceCreditBudget(
   db: DatabaseInstance,
   organizationId: string,
   pool: CreditPool,
): Promise<void> {
   const redis = getRedisConnection();
   if (!redis) return;

   const plan = await resolveOrganizationPlan(db, organizationId);
   try {
      await checkCreditBudget({ redis, organizationId, plan, pool });
   } catch (error) {
      throw new ORPCError("FORBIDDEN", {
         message: error instanceof Error ? error.message : "Crédito esgotado.",
      });
   }
}

// ---------------------------------------------------------------------------
// Track Credit Usage (convenience wrapper)
// ---------------------------------------------------------------------------

export interface TrackCreditUsageOptions {
   priceMinorUnits: number;
}

/**
 * Looks up the event price and increments the credit counter.
 * Safe to call when Redis is unavailable (no-op).
 * When options.priceMinorUnits is provided, that value is used instead of catalog lookup.
 */
export async function trackCreditUsage(
   db: DatabaseInstance,
   eventName: string,
   organizationId: string,
   pool: CreditPool,
   options?: TrackCreditUsageOptions,
): Promise<void> {
   const redis = getRedisConnection();
   if (!redis) return;

   const priceMinorUnits =
      options?.priceMinorUnits ??
      Number((await getEventPrice(db, eventName)).amount);
   await incrementCreditUsage(
      redis,
      organizationId,
      pool,
      priceMinorUnits,
   );
}
