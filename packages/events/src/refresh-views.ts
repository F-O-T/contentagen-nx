import type { DatabaseInstance } from "@packages/database/client";
import {
   contentTrafficSources,
   currentMonthStorageCost,
   currentMonthUsageByCategory,
   currentMonthUsageByEvent,
   dailyContentAnalytics,
   dailyEventCounts,
   dailyUsageByEvent,
   monthlyAiUsage,
   monthlySdkUsage,
} from "@packages/database/schema";

/**
 * Refresh all materialized views (billing + analytics).
 * Uses CONCURRENTLY to avoid blocking reads.
 * Should be called hourly via a scheduled job.
 */
export async function refreshUsageViews(db: DatabaseInstance): Promise<void> {
   const startTime = Date.now();

   try {
      await Promise.all([
         // Billing views
         db.refreshMaterializedView(dailyUsageByEvent).concurrently(),
         db.refreshMaterializedView(currentMonthUsageByEvent).concurrently(),
         db.refreshMaterializedView(currentMonthUsageByCategory).concurrently(),
         // Analytics views
         db.refreshMaterializedView(dailyContentAnalytics).concurrently(),
         db.refreshMaterializedView(contentTrafficSources).concurrently(),
         db.refreshMaterializedView(monthlySdkUsage).concurrently(),
         db.refreshMaterializedView(monthlyAiUsage).concurrently(),
         db.refreshMaterializedView(dailyEventCounts).concurrently(),
         db.refreshMaterializedView(currentMonthStorageCost).concurrently(),
      ]);

      const duration = Date.now() - startTime;
      console.log(`[Events] Refreshed materialized views in ${duration}ms`);
   } catch (error) {
      console.error("[Events] Failed to refresh materialized views:", error);
      throw error;
   }
}
