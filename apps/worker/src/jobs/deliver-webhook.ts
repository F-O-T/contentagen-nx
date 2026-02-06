import { createHmac } from "node:crypto";
import type { DatabaseInstance } from "@packages/database/client";
import {
	incrementWebhookFailureCount,
	updateWebhookDeliveryStatus,
	updateWebhookLastSuccess,
} from "@packages/database/repositories/webhook-repository";
import type { WebhookDeliveryJobData } from "@packages/queue/webhook-delivery";

function generateSignature(
	payload: string,
	secret: string,
	timestamp: number,
): string {
	const signaturePayload = `${timestamp}.${payload}`;
	return createHmac("sha256", secret)
		.update(signaturePayload)
		.digest("hex");
}

export async function deliverWebhook(
	db: DatabaseInstance,
	job: WebhookDeliveryJobData,
): Promise<void> {
	const {
		deliveryId,
		webhookEndpointId,
		url,
		payload,
		signingSecret,
		attemptNumber,
	} = job;

	const timestamp = Date.now();
	const payloadString = JSON.stringify(payload);
	const signature = generateSignature(payloadString, signingSecret, timestamp);

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Contentta-Signature": `t=${timestamp},v1=${signature}`,
				"X-Contentta-Event": String(payload.event ?? ""),
				"X-Contentta-Delivery-Id": deliveryId,
				"X-Contentta-Attempt": attemptNumber.toString(),
				"User-Agent": "Contentta-Webhooks/1.0",
			},
			body: payloadString,
			signal: AbortSignal.timeout(30_000),
		});

		const responseBody = await response.text().catch(() => "");

		if (response.ok) {
			await updateWebhookDeliveryStatus(db, deliveryId, {
				status: "success",
				httpStatusCode: response.status,
				responseBody: responseBody.slice(0, 1000),
				deliveredAt: new Date(),
			});

			await updateWebhookLastSuccess(db, webhookEndpointId);
			console.log(`[Worker] Webhook delivered to ${url} (attempt ${attemptNumber})`);
		} else {
			throw new Error(`HTTP ${response.status}: ${responseBody.slice(0, 500)}`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

		// Update delivery status — BullMQ handles retry scheduling
		await updateWebhookDeliveryStatus(db, deliveryId, {
			status: "retrying",
			errorMessage,
			attemptNumber,
		}).catch((e) => console.error("[Worker] Failed to update delivery status:", e));

		// If this was the last attempt, mark as failed
		if (attemptNumber >= 5) {
			await updateWebhookDeliveryStatus(db, deliveryId, {
				status: "failed",
				errorMessage: `Max attempts reached: ${errorMessage}`,
			}).catch((e) => console.error("[Worker] Failed to mark delivery as failed:", e));

			await incrementWebhookFailureCount(db, webhookEndpointId).catch((e) =>
				console.error("[Worker] Failed to increment failure count:", e),
			);
		}

		// Re-throw so BullMQ retries
		throw error;
	}
}
