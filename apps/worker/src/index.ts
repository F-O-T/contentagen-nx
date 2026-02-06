import { createDb } from "@packages/database/client";
import { env } from "@packages/environment/worker";
import { createQueueConnection } from "@packages/queue/connection";
import { createRedisConnection } from "@packages/redis/connection";
import { startScheduler } from "./scheduler";
import { startWebhookDeliveryWorker } from "./workers/webhook-delivery";

async function main(): Promise<void> {
	console.log("[Worker] Starting Contentta Worker...");

	// 1. Initialize Redis
	const redis = createRedisConnection(env.REDIS_URL);

	// 2. Initialize Database
	const db = createDb({ databaseUrl: env.DATABASE_URL });

	// 3. Create BullMQ connection
	const queueConnection = createQueueConnection(env.REDIS_URL);

	// 4. Start BullMQ workers
	const webhookWorker = startWebhookDeliveryWorker(queueConnection, db);

	// 5. Start scheduled jobs
	const scheduledTasks = startScheduler(db, redis);

	console.log("[Worker] All systems running");

	// Graceful shutdown
	const shutdown = async (signal: string) => {
		console.log(`[Worker] Received ${signal}, shutting down...`);

		for (const task of scheduledTasks) {
			task.stop();
		}

		await webhookWorker.close();
		await redis.quit();

		console.log("[Worker] Shutdown complete");
		process.exit(0);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
	console.error("[Worker] Fatal error:", error);
	process.exit(1);
});
