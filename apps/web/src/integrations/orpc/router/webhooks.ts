import { ORPCError } from "@orpc/server";
import { listEventCatalog } from "@packages/database/repositories/event-catalog-repository";
import {
   createWebhookEndpoint,
   deleteWebhookEndpoint,
   getWebhookDeliveries,
   getWebhookEndpoint,
   listWebhookEndpoints,
   updateWebhookEndpoint,
} from "@packages/database/repositories/webhook-repository";
import { createEmitFn } from "@packages/events/emit";
import {
   emitWebhookEndpointCreated,
   emitWebhookEndpointDeleted,
   emitWebhookEndpointUpdated,
} from "@packages/events/webhook";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createWebhookSchema = z.object({
   url: z.string().url(),
   description: z.string().optional(),
   eventPatterns: z.array(z.string()).min(1),
});

const updateWebhookSchema = z.object({
   id: z.string().uuid(),
   url: z.string().url().optional(),
   description: z.string().optional(),
   eventPatterns: z.array(z.string()).min(1).optional(),
   isActive: z.boolean().optional(),
});

// =============================================================================
// Webhook Procedures
// =============================================================================

/**
 * Create a new webhook endpoint
 */
export const create = protectedProcedure
   .input(createWebhookSchema)
   .handler(async ({ context, input }) => {
      const { auth, headers, organizationId, db, posthog, userId, teamId } =
         context;

      try {
         if (input.eventPatterns.some((pattern) => pattern.includes("*"))) {
            throw new ORPCError("BAD_REQUEST", {
               message: "Padrões com wildcard não são permitidos.",
            });
         }

         const catalogEntries = await listEventCatalog(db);
         const allowedEvents = new Set(
            catalogEntries
               .filter((event) => event.isActive)
               .map((e) => e.eventName),
         );
         const unknownEvents = input.eventPatterns.filter(
            (pattern) => !allowedEvents.has(pattern),
         );

         if (unknownEvents.length > 0) {
            throw new ORPCError("BAD_REQUEST", {
               message: `Eventos inválidos: ${unknownEvents.join(", ")}`,
            });
         }

         const apiKey = await auth.api.createApiKey({
            headers,
            body: {
               prefix: "cta_wh",
               name: `Webhook (${input.url})`,
               userId,
               metadata: {
                  type: "webhook",
                  organizationId,
                  teamId,
                  url: input.url,
               },
            },
         });

         const endpoint = await createWebhookEndpoint(db, {
            organizationId,
            teamId,
            url: input.url,
            description: input.description,
            eventPatterns: input.eventPatterns,
            apiKeyId: apiKey.id,
            signingSecret: apiKey.key,
         });

         try {
            await emitWebhookEndpointCreated(
               createEmitFn(db, posthog),
               { organizationId, userId, teamId },
               { endpointId: endpoint.id, url: input.url },
            );
         } catch {
            // Event emission must not break the main flow
         }

         return {
            endpoint: {
               ...endpoint,
               signingSecret: `${endpoint.signingSecret.slice(0, 8)}...`,
            },
            plaintextSecret: apiKey.key,
         };
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message:
                     "Authentication required to create webhook endpoints",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message:
                     "Insufficient permissions to create webhook endpoints",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create webhook endpoint",
         });
      }
   });

/**
 * List all webhook endpoints for the organization
 */
export const list = protectedProcedure.handler(async ({ context }) => {
   const { db, teamId } = context;

   const endpoints = await listWebhookEndpoints(db, teamId);

   // Mask signing secrets in responses
   return endpoints.map((e) => ({
      ...e,
      signingSecret: `${e.signingSecret.slice(0, 8)}...`,
   }));
});

/**
 * Get webhook endpoint details
 */
export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, teamId } = context;

      const endpoint = await getWebhookEndpoint(db, input.id);

      if (!endpoint || endpoint.teamId !== teamId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Webhook endpoint não encontrado.",
         });
      }

      return {
         ...endpoint,
         signingSecret: `${endpoint.signingSecret.slice(0, 8)}...`,
      };
   });

/**
 * Update webhook endpoint
 */
export const update = protectedProcedure
   .input(updateWebhookSchema)
   .handler(async ({ context, input }) => {
      const { db, posthog, userId, teamId } = context;

      const endpoint = await getWebhookEndpoint(db, input.id);

      if (!endpoint || endpoint.teamId !== teamId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Webhook endpoint não encontrado.",
         });
      }

      if (input.eventPatterns) {
         if (input.eventPatterns.some((pattern) => pattern.includes("*"))) {
            throw new ORPCError("BAD_REQUEST", {
               message: "Padrões com wildcard não são permitidos.",
            });
         }

         const catalogEntries = await listEventCatalog(db);
         const allowedEvents = new Set(
            catalogEntries
               .filter((event) => event.isActive)
               .map((e) => e.eventName),
         );
         const unknownEvents = input.eventPatterns.filter(
            (pattern) => !allowedEvents.has(pattern),
         );

         if (unknownEvents.length > 0) {
            throw new ORPCError("BAD_REQUEST", {
               message: `Eventos inválidos: ${unknownEvents.join(", ")}`,
            });
         }
      }

      const { id: _id, ...updateData } = input;
      const updated = await updateWebhookEndpoint(db, input.id, updateData);

      try {
         const changedFields = Object.keys(updateData).filter(
            (k) => updateData[k as keyof typeof updateData] !== undefined,
         );
         await emitWebhookEndpointUpdated(
            createEmitFn(db, posthog),
            {
               organizationId: endpoint.organizationId,
               userId,
               teamId,
            },
            { endpointId: input.id, changedFields },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return updated;
   });

/**
 * Delete webhook endpoint
 */
export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { auth, headers, db, posthog, userId, teamId } = context;

      try {
         const endpoint = await getWebhookEndpoint(db, input.id);

         if (!endpoint || endpoint.teamId !== teamId) {
            throw new ORPCError("NOT_FOUND", {
               message: "Webhook endpoint não encontrado.",
            });
         }

         if (endpoint.apiKeyId) {
            await auth.api.deleteApiKey({
               headers,
               body: { keyId: endpoint.apiKeyId },
            });
         }

         await deleteWebhookEndpoint(db, input.id);

         try {
            await emitWebhookEndpointDeleted(
               createEmitFn(db, posthog),
               {
                  organizationId: endpoint.organizationId,
                  userId,
                  teamId,
               },
               { endpointId: input.id },
            );
         } catch {
            // Event emission must not break the main flow
         }

         return { success: true };
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message:
                     "Authentication required to delete webhook endpoints",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message:
                     "Insufficient permissions to delete webhook endpoints",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to delete webhook endpoint",
         });
      }
   });

/**
 * List deliveries for a webhook endpoint
 */
export const deliveries = protectedProcedure
   .input(
      z.object({
         webhookId: z.string().uuid(),
         page: z.number().min(1).optional().default(1),
         limit: z.number().min(1).max(100).optional().default(50),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, teamId } = context;

      const endpoint = await getWebhookEndpoint(db, input.webhookId);

      if (!endpoint || endpoint.teamId !== teamId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Webhook endpoint não encontrado.",
         });
      }

      const items = await getWebhookDeliveries(db, input.webhookId, {
         offset: (input.page - 1) * input.limit,
         limit: input.limit,
      });

      return { items, page: input.page, limit: input.limit };
   });
