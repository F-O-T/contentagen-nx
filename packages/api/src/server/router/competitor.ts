import {
   protectedProcedure,
   router,
   organizationProcedure,
   hasGenerationCredits,
   organizationOwnerProcedure,
   publicProcedure,
} from "../trpc";
import { CompetitorInsertSchema } from "@packages/database/schema";
import {
   createCompetitor,
   getCompetitorById,
   updateCompetitor,
   deleteCompetitor,
   listCompetitors,
   searchCompetitors,
   getTotalCompetitors,
} from "@packages/database/repositories/competitor-repository";
import {
   getFeaturesByCompetitorId,
   getTotalFeaturesByCompetitorId,
} from "@packages/database/repositories/competitor-feature-repository";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { deleteFeaturesByCompetitorId } from "@packages/database/repositories/competitor-feature-repository";
import {
   eventEmitter,
   EVENTS,
   type CompetitorFeaturesStatusChangedPayload,
   type CompetitorAnalysisStatusChangedPayload,
} from "@packages/server-events";
import { on } from "node:events";
import { enqueueCrawlCompetitorForFeaturesJob } from "@packages/workers/queues/crawl-competitor-for-features-queue";
import { enqueueCreateCompetitorKnowledgeWorkflowJob } from "@packages/workers/queues/create-competitor-knowledge-workflow-queue";
import { enqueueExtractCompetitorBrandInfoJob } from "@packages/workers/queues/extract-competitor-brand-info-queue";

export const competitorRouter = router({
   list: protectedProcedure
      .input(
         z.object({
            page: z.number().min(1).optional().default(1),
            limit: z.number().min(1).max(100).optional().default(20),
            search: z.string().optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw APIError.unauthorized("User must be authenticated.");
            }

            const competitors = await listCompetitors(resolvedCtx.db, {
               userId,
               organizationId: organizationId || undefined,
               page: input.page,
               limit: input.limit,
            });

            const total = await getTotalCompetitors(resolvedCtx.db, {
               userId,
               organizationId: organizationId || undefined,
            });

            return {
               items: competitors,
               total,
               page: input.page,
               limit: input.limit,
            };
         } catch (err) {
            console.error("Error listing competitors:", err);
            propagateError(err);
            throw APIError.internal("Failed to list competitors.");
         }
      }),

   create: organizationOwnerProcedure
      .use(hasGenerationCredits)
      .input(
         CompetitorInsertSchema.pick({
            websiteUrl: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to create competitors.",
               );
            }

            const created = await createCompetitor(resolvedCtx.db, {
               ...input,
               userId,
               organizationId,
            });

            await Promise.all([
               await enqueueCrawlCompetitorForFeaturesJob({
                  competitorId: created.id,
                  userId,
                  websiteUrl: input.websiteUrl,
                  runtimeContext: {
                     language: resolvedCtx.language,
                     userId,
                  },
               }),

               await enqueueCreateCompetitorKnowledgeWorkflowJob({
                  competitorId: created.id,
                  userId,
                  websiteUrl: input.websiteUrl,
                  runtimeContext: {
                     language: resolvedCtx.language,
                     userId,
                  },
               }),
               await enqueueExtractCompetitorBrandInfoJob({
                  competitorId: created.id,
                  userId,
                  websiteUrl: input.websiteUrl,
                  runtimeContext: {
                     language: resolvedCtx.language,
                     userId,
                  },
               }),
            ]);

            return created;
         } catch (err) {
            console.error("Error creating competitor:", err);
            propagateError(err);
            throw APIError.internal("Failed to create competitor.");
         }
      }),

   update: protectedProcedure
      .input(
         z.object({
            id: z.uuid(),
            data: CompetitorInsertSchema.pick({
               name: true,
               websiteUrl: true,
            }).partial(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to update competitors.",
               );
            }

            // Verify the competitor exists and belongs to the user/organization
            const existing = await getCompetitorById(resolvedCtx.db, input.id);
            if (
               existing.userId !== userId &&
               existing.organizationId !== organizationId
            ) {
               throw APIError.forbidden(
                  "You don't have permission to update this competitor.",
               );
            }

            const updated = await updateCompetitor(
               resolvedCtx.db,
               input.id,
               input.data,
            );
            return updated;
         } catch (err) {
            console.error("Error updating competitor:", err);
            propagateError(err);
            throw APIError.internal("Failed to update competitor.");
         }
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to delete competitors.",
               );
            }

            // Verify the competitor exists and belongs to the user/organization
            const existing = await getCompetitorById(resolvedCtx.db, input.id);
            if (
               existing.userId !== userId &&
               existing.organizationId !== organizationId
            ) {
               throw APIError.forbidden(
                  "You don't have permission to delete this competitor.",
               );
            }

            await deleteCompetitor(resolvedCtx.db, input.id);
            return { success: true };
         } catch (err) {
            console.error("Error deleting competitor:", err);
            propagateError(err);
            throw APIError.internal("Failed to delete competitor.");
         }
      }),

   analyze: organizationProcedure
      .use(hasGenerationCredits)

      .input(z.object({ id: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to analyze competitors.",
               );
            }

            const competitor = await getCompetitorById(
               resolvedCtx.db,
               input.id,
            );

            // Verify the competitor belongs to the user/organization
            if (
               competitor.userId !== userId &&
               competitor.organizationId !== organizationId
            ) {
               throw APIError.forbidden(
                  "You don't have permission to analyze this competitor.",
               );
            }

            await deleteFeaturesByCompetitorId(resolvedCtx.db, competitor.id);

            await enqueueCrawlCompetitorForFeaturesJob({
               competitorId: competitor.id,
               userId,
               websiteUrl: competitor.websiteUrl,
            });
            return { success: true };
         } catch (err) {
            console.error("Error analyzing competitor:", err);
            propagateError(err);
            throw APIError.internal("Failed to analyze competitor.");
         }
      }),

   get: protectedProcedure
      .input(z.object({ id: z.uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to view competitors.",
               );
            }

            const competitor = await getCompetitorById(
               resolvedCtx.db,
               input.id,
            );

            // Verify the competitor belongs to the user/organization
            if (
               competitor.userId !== userId &&
               competitor.organizationId !== organizationId
            ) {
               throw APIError.forbidden(
                  "You don't have permission to view this competitor.",
               );
            }

            return competitor;
         } catch (err) {
            console.error("Error getting competitor:", err);
            propagateError(err);
            throw APIError.internal("Failed to get competitor.");
         }
      }),

   getFeatures: protectedProcedure
      .input(
         z.object({
            competitorId: z.uuid(),
            page: z.number().min(1).optional().default(1),
            limit: z.number().min(1).max(100).optional().default(12),
            sortBy: z
               .enum(["extractedAt", "featureName"])
               .optional()
               .default("extractedAt"),
            sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to view competitor features.",
               );
            }

            // Verify the competitor exists and belongs to the user/organization
            const competitor = await getCompetitorById(
               resolvedCtx.db,
               input.competitorId,
            );
            if (
               competitor.userId !== userId &&
               competitor.organizationId !== organizationId
            ) {
               throw APIError.forbidden(
                  "You don't have permission to view this competitor's features.",
               );
            }

            const [features, total] = await Promise.all([
               getFeaturesByCompetitorId(resolvedCtx.db, input.competitorId, {
                  page: input.page,
                  limit: input.limit,
                  sortBy: input.sortBy,
                  sortOrder: input.sortOrder,
               }),
               getTotalFeaturesByCompetitorId(
                  resolvedCtx.db,
                  input.competitorId,
               ),
            ]);

            const totalPages = Math.ceil(total / input.limit);

            return {
               features,
               total,
               page: input.page,
               limit: input.limit,
               totalPages,
            };
         } catch (err) {
            console.error("Error getting competitor features:", err);
            propagateError(err);
            throw APIError.internal("Failed to get competitor features.");
         }
      }),

   search: protectedProcedure
      .input(
         z.object({
            query: z.string().min(1),
            page: z.number().min(1).optional().default(1),
            limit: z.number().min(1).max(100).optional().default(20),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId) {
               throw APIError.unauthorized("User must be authenticated.");
            }

            const competitors = await searchCompetitors(resolvedCtx.db, {
               query: input.query,
               userId,
               organizationId: organizationId || undefined,
               page: input.page,
               limit: input.limit,
            });
            return { items: competitors };
         } catch (err) {
            console.error("Error searching competitors:", err);
            propagateError(err);
            throw APIError.internal("Failed to search competitors.");
         }
      }),
   onFeaturesStatusChanged: publicProcedure
      .input(z.object({ competitorId: z.string().optional() }).optional())
      .subscription(async function* (opts) {
         for await (const [payload] of on(
            eventEmitter,
            EVENTS.competitorFeaturesStatus,
            {
               signal: opts.signal,
            },
         )) {
            const event = payload as CompetitorFeaturesStatusChangedPayload;
            if (
               !opts.input?.competitorId ||
               opts.input.competitorId === event.competitorId
            ) {
               yield event;
            }
         }
      }),
   onAnalysisStatusChanged: publicProcedure
      .input(z.object({ competitorId: z.string().optional() }).optional())
      .subscription(async function* (opts) {
         for await (const [payload] of on(
            eventEmitter,
            EVENTS.competitorAnalysisStatus,
            {
               signal: opts.signal,
            },
         )) {
            const event = payload as CompetitorAnalysisStatusChangedPayload;
            if (
               !opts.input?.competitorId ||
               opts.input.competitorId === event.competitorId
            ) {
               yield event;
            }
         }
      }),
});
