import type { DatabaseInstance } from "@packages/database/client";
import { refreshUsageViews } from "@packages/events/refresh-views";

export async function runRefreshViews(db: DatabaseInstance): Promise<void> {
	const startTime = Date.now();
	console.log("[Worker] Starting materialized view refresh...");

	await refreshUsageViews(db);

	const duration = Date.now() - startTime;
	console.log(`[Worker] Materialized views refreshed in ${duration}ms`);
}
