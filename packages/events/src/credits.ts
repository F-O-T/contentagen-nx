import { createMoney, greaterThanOrEqual } from "@f-o-t/money";
import type { PlanName } from "@packages/stripe/constants";
import type { Redis } from "ioredis";
import { type CreditPool, PLAN_CREDIT_BUDGETS } from "./pricing";

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
