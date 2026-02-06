import type { DatabaseInstance } from "@packages/database/client";
import { reconcileCreditCounters } from "@packages/events/reconcile";
import type { Redis } from "ioredis";

export async function runReconcileCredits(
	db: DatabaseInstance,
	redis: Redis,
): Promise<void> {
	const startTime = Date.now();
	console.log("[Worker] Starting credit counter reconciliation...");

	await reconcileCreditCounters(db, redis);

	const duration = Date.now() - startTime;
	console.log(`[Worker] Credit counters reconciled in ${duration}ms`);
}
