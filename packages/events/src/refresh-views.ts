import type { DatabaseInstance } from "@packages/database/client";
import {
   currentMonthUsageByCategory,
   currentMonthUsageByEvent,
   dailyUsageByEvent,
} from "@packages/database/schema";

/**
 * Refresh all billing materialized views.
 * Uses CONCURRENTLY to avoid blocking reads.
 * Should be called hourly via a scheduled job.
 */
export async function refreshUsageViews(db: DatabaseInstance): Promise<void> {
   const startTime = Date.now();

   try {
      await Promise.all([
         db.refreshMaterializedView(dailyUsageByEvent).concurrently(),
         db.refreshMaterializedView(currentMonthUsageByEvent).concurrently(),
         db.refreshMaterializedView(currentMonthUsageByCategory).concurrently(),
      ]);

      const duration = Date.now() - startTime;
      console.log(`[Events] Refreshed materialized views in ${duration}ms`);
   } catch (error) {
      console.error("[Events] Failed to refresh materialized views:", error);
      throw error;
   }
}
