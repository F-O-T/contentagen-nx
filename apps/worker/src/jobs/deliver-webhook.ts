import { createHmac } from "node:crypto";
import type { WebhookDeliveryJobData } from "@packages/queue/webhook-delivery";

/**
 * Generate HMAC-SHA256 signature for webhook payload.
 */
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

/**
 * Deliver a webhook to the customer's endpoint.
 * Throwing signals BullMQ to retry with exponential backoff.
 */
export async function deliverWebhook(
	job: WebhookDeliveryJobData,
): Promise<void> {
	const {
		deliveryId,
		url,
		payload,
		signingSecret,
		attemptNumber,
	} = job;

	const timestamp = Date.now();
	const payloadString = JSON.stringify(payload);
	const signature = generateSignature(payloadString, signingSecret, timestamp);

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

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(
			`Webhook delivery failed: HTTP ${response.status} — ${body.slice(0, 500)}`,
		);
	}

	console.log(
		`[Worker] Webhook delivered to ${url} (attempt ${attemptNumber})`,
	);
}
