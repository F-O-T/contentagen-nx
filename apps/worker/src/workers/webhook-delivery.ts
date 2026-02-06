import { Worker } from "bullmq";
import type { ConnectionOptions } from "bullmq";
import type { DatabaseInstance } from "@packages/database/client";
import {
	WEBHOOK_DELIVERY_QUEUE,
	type WebhookDeliveryJobData,
} from "@packages/queue/webhook-delivery";
import { deliverWebhook } from "../jobs/deliver-webhook";

/**
 * Start the webhook delivery BullMQ worker.
 * Returns the worker instance for graceful shutdown.
 */
export function startWebhookDeliveryWorker(
	connection: ConnectionOptions,
	db: DatabaseInstance,
): Worker<WebhookDeliveryJobData> {
	const worker = new Worker<WebhookDeliveryJobData>(
		WEBHOOK_DELIVERY_QUEUE,
		async (job) => {
			await deliverWebhook(db, job.data);
		},
		{
			connection,
			concurrency: 10,
		},
	);

	worker.on("completed", (job) => {
		console.log(`[Worker] Webhook job ${job.id} completed`);
	});

	worker.on("failed", (job, err) => {
		console.error(
			`[Worker] Webhook job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts}):`,
			err.message,
		);
	});

	console.log("[Worker] Webhook delivery worker started");
	return worker;
}
