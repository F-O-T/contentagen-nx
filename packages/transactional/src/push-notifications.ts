import webpush from "web-push";
import type { PushSubscription } from "web-push";

export interface SendOptions {
   TTL?: number;
   urgency?: "very-low" | "low" | "normal" | "high";
   topic?: string;
   headers?: Record<string, string>;
}

export interface SendResult {
   statusCode: number;
   headers: Record<string, string>;
   body: string;
}

export function generateVapidKeys() {
   return webpush.generateVAPIDKeys();
}

export function setVapidDetails(
   subject: string,
   publicKey: string,
   privateKey: string,
) {
   webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushNotification(
   subscription: PushSubscription,
   payload: string,
   options?: SendOptions,
): Promise<SendResult> {
   const result = await webpush.sendNotification(
      subscription,
      payload,
      options,
   );
   return {
      statusCode: result.statusCode,
      headers: result.headers,
      body: result.body,
   };
}
