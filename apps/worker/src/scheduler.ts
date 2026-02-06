import * as cron from "node-cron";
import type { DatabaseInstance } from "@packages/database/client";
import type { Redis } from "ioredis";
import { runRefreshViews } from "./jobs/refresh-views";
import { runReconcileCredits } from "./jobs/reconcile-credits";

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

	tasks.push(hourlyTask);
	console.log("[Scheduler] Cron jobs registered (hourly billing reconciliation)");

	return tasks;
}
