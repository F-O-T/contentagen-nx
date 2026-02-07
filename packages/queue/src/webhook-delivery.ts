import type { ConnectionOptions } from "bullmq";
import { Queue } from "bullmq";

export const WEBHOOK_DELIVERY_QUEUE = "webhook-delivery";

export interface WebhookDeliveryJobData {
   deliveryId: string;
   webhookEndpointId: string;
   eventId: string;
   url: string;
   payload: Record<string, unknown>;
   signingSecret: string;
   attemptNumber: number;
}

/**
 * Create the webhook delivery queue (producer side).
 * Call this from any app that needs to enqueue webhook deliveries.
 */
export function createWebhookDeliveryQueue(
   connection: ConnectionOptions,
): Queue<WebhookDeliveryJobData> {
   return new Queue<WebhookDeliveryJobData>(WEBHOOK_DELIVERY_QUEUE, {
      connection,
      defaultJobOptions: {
         attempts: 5,
         backoff: {
            type: "exponential",
            delay: 60_000,
         },
         removeOnComplete: { count: 1000 },
         removeOnFail: { count: 5000 },
      },
   });
}
