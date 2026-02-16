import * as cron from "node-cron";
import type { DatabaseInstance } from "@packages/database/client";
import type { Redis } from "ioredis";
import { runReconcileCredits } from "./jobs/reconcile-credits";
import { runRefreshInsights } from "./jobs/refresh-insights";
import { runRefreshViews } from "./jobs/refresh-views";

/**
 * Start all scheduled (cron) jobs.
 * Returns the cron tasks for graceful shutdown.
 */
export function startScheduler(
	db: DatabaseInstance,
	redis: Redis,
): cron.ScheduledTask[] {
	const tasks: cron.ScheduledTask[] = [];

	// Hourly: refresh materialized views, then reconcile credit counters
	const hourlyTask = cron.schedule("0 * * * *", async () => {
		console.log("[Scheduler] Running hourly billing reconciliation...");
		try {
			await runRefreshViews(db);
			await runReconcileCredits(db, redis);
			console.log("[Scheduler] Hourly billing reconciliation complete");
		} catch (error) {
			console.error("[Scheduler] Hourly job failed:", error);
		}
	});

	// Every 3 hours: refresh insight cached results
	const insightsTask = cron.schedule("0 */3 * * *", async () => {
		console.log("[Scheduler] Running insight cache refresh...");
		try {
			await runRefreshInsights(db);
			console.log("[Scheduler] Insight cache refresh complete");
		} catch (error) {
			console.error("[Scheduler] Insight refresh job failed:", error);
		}
	});

	tasks.push(hourlyTask, insightsTask);
	console.log(
		"[Scheduler] Cron jobs registered (hourly billing reconciliation, 3-hourly insight refresh)",
	);

	return tasks;
}
