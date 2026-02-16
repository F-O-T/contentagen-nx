import { ORPCError } from "@orpc/server";
import { type EventCategory, getEventCategory } from "@packages/events/catalog";
import { emitEventBatch } from "@packages/events/emit";
import { z } from "zod";
import { sdkProcedure } from "../server";

// =============================================================================
// Events Procedures
// =============================================================================

/**
 * Track a single event
 */
export const track = sdkProcedure
   .input(
      z.object({
         eventName: z.string(),
         properties: z.record(z.string(), z.unknown()),
         timestamp: z.number().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, posthog, organizationId, userId, request } = context;

      // Validate event name exists in catalog
      const category = getEventCategory(input.eventName);

      if (!category) {
         throw new ORPCError("BAD_REQUEST", {
            message: `Unknown event: ${input.eventName}`,
         });
      }

      // Extract request metadata
      const ipAddress =
         request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
         request.headers.get("x-real-ip") ??
         undefined;
      const userAgent = request.headers.get("user-agent") ?? undefined;

      // Build event payload
      const eventData = {
         organizationId,
         eventName: input.eventName,
         eventCategory: category,
         properties: {
            ...input.properties,
            ...(input.timestamp ? { sdk_timestamp: input.timestamp } : {}),
         },
         userId: userId ?? undefined,
         ipAddress,
         userAgent,
      };

      // Emit event (batch with single item for consistency)
      await emitEventBatch({
         db,
         posthog,
         events: [eventData],
      });

      return {
         success: true as const,
         eventsProcessed: 1,
         eventsRejected: 0,
      };
   });

/**
 * Track multiple events in a batch
 */
export const batch = sdkProcedure
   .input(
      z.object({
         events: z
            .array(
               z.object({
                  eventName: z.string(),
                  properties: z.record(z.string(), z.unknown()),
                  timestamp: z.number().optional(),
               }),
            )
            .max(100),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, posthog, organizationId, userId, request } = context;

      // Extract request metadata (same for all events in batch)
      const ipAddress =
         request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
         request.headers.get("x-real-ip") ??
         undefined;
      const userAgent = request.headers.get("user-agent") ?? undefined;

      // Validate events and split into accepted/rejected
      const validEvents: Array<{
         organizationId: string;
         eventName: string;
         eventCategory: EventCategory;
         properties: Record<string, unknown>;
         userId?: string;
         ipAddress?: string;
         userAgent?: string;
      }> = [];
      let eventsRejected = 0;

      for (const event of input.events) {
         const category = getEventCategory(event.eventName);

         if (!category) {
            eventsRejected++;
            continue;
         }

         validEvents.push({
            organizationId,
            eventName: event.eventName,
            eventCategory: category,
            properties: {
               ...event.properties,
               ...(event.timestamp ? { sdk_timestamp: event.timestamp } : {}),
            },
            userId: userId ?? undefined,
            ipAddress,
            userAgent,
         });
      }

      // Batch-emit all valid events
      if (validEvents.length > 0) {
         await emitEventBatch({
            db,
            posthog,
            events: validEvents,
         });
      }

      return {
         success: true as const,
         eventsProcessed: validEvents.length,
         eventsRejected,
      };
   });
