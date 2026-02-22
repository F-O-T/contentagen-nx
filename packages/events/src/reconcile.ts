import { parseDecimalToMinorUnits } from "@f-o-t/money";
import type { DatabaseInstance } from "@packages/database/client";
import { currentMonthUsageByCategory } from "@packages/database/schema";
import type { Redis } from "ioredis";
import { type CreditPool, POOL_CATEGORIES } from "./credits";

const PRICE_SCALE = 6;

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
): Promise<void> {
   const startTime = Date.now();

   try {
      // Query all current month usage grouped by org and category
      const rows = await db.select().from(currentMonthUsageByCategory);

      // Group costs by organization and pool
      const orgPoolCosts = new Map<string, Map<CreditPool, bigint>>();

      for (const row of rows) {
         // Determine which pool this category belongs to
         let pool: CreditPool | undefined;
         for (const [p, categories] of Object.entries(POOL_CATEGORIES)) {
            if (
               categories.includes(
                  row.eventCategory as (typeof categories)[number],
               )
            ) {
               pool = p as CreditPool;
               break;
            }
         }
         if (!pool) continue;

         if (!orgPoolCosts.has(row.organizationId)) {
            orgPoolCosts.set(row.organizationId, new Map());
         }
         const poolMap = orgPoolCosts.get(row.organizationId)!;

         const currentCost = poolMap.get(pool) ?? 0n;
         const rowCost = parseDecimalToMinorUnits(
            row.monthToDateCost,
            PRICE_SCALE,
         );
         poolMap.set(pool, currentCost + rowCost);
      }

      // SET Redis counters to match materialized view data
      const pipeline = redis.pipeline();

      for (const [orgId, poolMap] of orgPoolCosts) {
         for (const [pool, costMinorUnits] of poolMap) {
            const key = `credits:${orgId}:${pool}_used`;
            pipeline.set(key, costMinorUnits.toString());
            // Refresh TTL: end of current month + 1 day buffer
            const now = new Date();
            const endOfMonth = new Date(
               now.getFullYear(),
               now.getMonth() + 1,
               1,
            );
            const endOfMonthPlusOneDay = new Date(
               endOfMonth.getTime() + 24 * 60 * 60 * 1000,
            );
            const ttlMs = endOfMonthPlusOneDay.getTime() - now.getTime();
            pipeline.pexpire(key, ttlMs);
         }
      }

      await pipeline.exec();

      const duration = Date.now() - startTime;
      console.log(
         `[Events] Reconciled credit counters for ${orgPoolCosts.size} organizations in ${duration}ms`,
      );
   } catch (error) {
      console.error("[Events] Failed to reconcile credit counters:", error);
      throw error;
   }
}
