import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type NewWebhookDelivery,
   type NewWebhookEndpoint,
   webhookDeliveries,
   webhookEndpoints,
} from "../schemas/webhooks";

/**
 * Generate a 32-byte hex signing secret for webhook endpoints.
 */
export function generateWebhookSecret(): string {
   const bytes = crypto.getRandomValues(new Uint8Array(32));
   return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Webhook Endpoints
// ---------------------------------------------------------------------------

export async function createWebhookEndpoint(
   db: DatabaseInstance,
   data: NewWebhookEndpoint,
) {
   try {
      const [endpoint] = await db
         .insert(webhookEndpoints)
         .values(data)
         .returning();

      return endpoint;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create webhook endpoint");
   }
}

export async function listWebhookEndpoints(
   db: DatabaseInstance,
   teamId: string,
) {
   try {
      return await db
         .select()
         .from(webhookEndpoints)
         .where(eq(webhookEndpoints.teamId, teamId))
         .orderBy(desc(webhookEndpoints.createdAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list webhook endpoints");
   }
}

export async function getWebhookEndpoint(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      const [endpoint] = await db
         .select()
         .from(webhookEndpoints)
         .where(eq(webhookEndpoints.id, webhookId))
         .limit(1);

      return endpoint ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get webhook endpoint");
   }
}

export async function updateWebhookEndpoint(
   db: DatabaseInstance,
   webhookId: string,
   data: Partial<
      Pick<
         NewWebhookEndpoint,
         "url" | "description" | "eventPatterns" | "isActive"
      >
   >,
) {
   try {
      const [updated] = await db
         .update(webhookEndpoints)
         .set(data)
         .where(eq(webhookEndpoints.id, webhookId))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update webhook endpoint");
   }
}

export async function deleteWebhookEndpoint(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      await db
         .delete(webhookEndpoints)
         .where(eq(webhookEndpoints.id, webhookId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete webhook endpoint");
   }
}

export async function updateWebhookLastSuccess(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      await db
         .update(webhookEndpoints)
         .set({
            lastSuccessAt: new Date(),
            failureCount: 0,
         })
         .where(eq(webhookEndpoints.id, webhookId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update webhook success");
   }
}

export async function incrementWebhookFailureCount(
   db: DatabaseInstance,
   webhookId: string,
) {
   try {
      await db
         .update(webhookEndpoints)
         .set({
            failureCount: sql`${webhookEndpoints.failureCount} + 1`,
            lastFailureAt: new Date(),
         })
         .where(eq(webhookEndpoints.id, webhookId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to increment failure count");
   }
}

/**
 * Find all active webhook endpoints for an organization
 * whose event patterns match the given event name.
 */
export async function findMatchingWebhooks(
   db: DatabaseInstance,
   organizationId: string,
   eventName: string,
   teamId?: string,
) {
   try {
      const endpoints = await db
         .select()
         .from(webhookEndpoints)
         .where(
            and(
               eq(webhookEndpoints.organizationId, organizationId),
               eq(webhookEndpoints.isActive, true),
               ...(teamId ? [eq(webhookEndpoints.teamId, teamId)] : []),
            ),
         );

      return endpoints.filter((endpoint) =>
         endpoint.eventPatterns.some((pattern) =>
            matchesPattern(eventName, pattern),
         ),
      );
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to find matching webhooks");
   }
}

/**
 * Check if an event name matches a subscription pattern.
 * Supports wildcard suffix: "content.*" matches "content.page.published"
 * Supports exact match: "form.submitted" matches "form.submitted"
 */
function matchesPattern(eventName: string, pattern: string): boolean {
   if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      return eventName.startsWith(`${prefix}.`);
   }
   return eventName === pattern;
}

// ---------------------------------------------------------------------------
// Webhook Deliveries
// ---------------------------------------------------------------------------

export async function createWebhookDelivery(
   db: DatabaseInstance,
   data: NewWebhookDelivery,
) {
   try {
      const [delivery] = await db
         .insert(webhookDeliveries)
         .values(data)
         .returning();

      return delivery;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create webhook delivery");
   }
}

export async function updateWebhookDeliveryStatus(
   db: DatabaseInstance,
   deliveryId: string,
   data: {
      status: string;
      httpStatusCode?: number;
      responseBody?: string;
      errorMessage?: string;
      attemptNumber?: number;
      nextRetryAt?: Date;
      deliveredAt?: Date;
   },
) {
   try {
      const [updated] = await db
         .update(webhookDeliveries)
         .set(data)
         .where(eq(webhookDeliveries.id, deliveryId))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update webhook delivery");
   }
}

export async function getWebhookDeliveries(
   db: DatabaseInstance,
   webhookId: string,
   options: { offset?: number; limit?: number } = {},
) {
   try {
      const { offset = 0, limit = 50 } = options;

      return await db
         .select()
         .from(webhookDeliveries)
         .where(eq(webhookDeliveries.webhookEndpointId, webhookId))
         .orderBy(desc(webhookDeliveries.createdAt))
         .offset(offset)
         .limit(limit);
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get webhook deliveries");
   }
}
