import { computeInsightData } from "@packages/analytics/compute-insight";
import type { DatabaseInstance } from "@packages/database/client";
import { insights } from "@packages/database/schemas/insights";
import { eq } from "drizzle-orm";

/**
 * Background job that refreshes cached results for all insights.
 * Runs every 3 hours to keep dashboard data up-to-date without blocking UI.
 */
export async function runRefreshInsights(
	db: DatabaseInstance,
): Promise<void> {
	const startTime = Date.now();
	console.log("[Worker] Starting insight cache refresh...");

	try {
		// Fetch all insights
		const allInsights = await db.select().from(insights);

		console.log(`[Worker] Found ${allInsights.length} insights to refresh`);

		let successCount = 0;
		let failureCount = 0;

		// Refresh each insight sequentially to avoid overwhelming the database
		for (const insight of allInsights) {
			try {
				const freshData = await computeInsightData(db, insight);

				await db
					.update(insights)
					.set({
						cachedResults: freshData,
						lastComputedAt: new Date(),
					})
					.where(eq(insights.id, insight.id));

				successCount++;
			} catch (error) {
				console.error(
					`[Worker] Failed to refresh insight ${insight.id} (${insight.name}):`,
					error,
				);
				failureCount++;
			}
		}

		const duration = Date.now() - startTime;
		console.log(
			`[Worker] Insight cache refresh completed in ${duration}ms (${successCount} succeeded, ${failureCount} failed)`,
		);
	} catch (error) {
		console.error("[Worker] Insight cache refresh failed:", error);
		throw error;
	}
}
