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
   getOrCreateCompetitorSummary,
   updateCompetitorSummary,
   getCompetitorSummaryByOrganization,
} from "@packages/database/repositories/competitor-summary-repository";
import {
   eventEmitter,
   EVENTS,
   type CompetitorStatusChangedPayload,
} from "@packages/server-events";
import { on } from "node:events";
import { enqueueCreateCompleteKnowledgeWorkflowJob } from "@packages/workers/queues/create-complete-knowledge-workflow-queue";
import { enqueueCreateFeaturesKnowledgeJob } from "@packages/workers/queues/create-features-knowledge-queue";
import { enqueueCreateCompetitorSummaryJob } from "@packages/workers/queues/create-competitor-summary-queue";

export const competitorRouter = router({
   getSummary: organizationProcedure
      .use(hasGenerationCredits)
      .query(async ({ ctx }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to view competitor summaries.",
               );
            }

            const summaryRecord = await getCompetitorSummaryByOrganization(
               resolvedCtx.db,
               organizationId,
            );

            // Get competitor count
            const competitors = await listCompetitors(resolvedCtx.db, {
               userId,
               organizationId,
               page: 1,
               limit: 1000,
            });

            // If no summary exists, create one and queue generation
            if (!summaryRecord) {
               // Check if we have competitors to analyze
               if (competitors.length === 0) {
                  return `# Weekly Competitive Brief

*No competitors found. Add competitors to generate your weekly competitive insights.*

## Getting Started
1. Add competitors to your organization
2. We'll automatically generate your weekly strategic brief
3. Check back here for actionable weekly insights

**Note**: Start by adding your main competitors to get valuable weekly briefings.`;
               }

               // Create summary record and queue generation
               const summaryRecord = await getOrCreateCompetitorSummary(
                  resolvedCtx.db,
                  organizationId,
                  userId,
               );

               if (!summaryRecord) {
                  throw APIError.internal(
                     "Failed to create competitor summary record.",
                  );
               }
               // Update status to pending
               await updateCompetitorSummary(resolvedCtx.db, summaryRecord.id, {
                  status: "pending",
                  errorMessage: null,
               });

               // Enqueue background job to generate the summary
               await enqueueCreateCompetitorSummaryJob({
                  organizationId,
                  userId,
                  summaryId: summaryRecord.id,
                  runtimeContext: {
                     language: resolvedCtx.language,
                     userId,
                  },
               });

               // Return placeholder while generating
               return `# Weekly Competitive Brief

*Generating your weekly competitive insights... Please check back in a few minutes.*

## Current Competitors
Analyzing **${competitors.length}** competitors for this week's strategic brief.

## What's Coming
- Key competitor moves to watch this week
- Actionable opportunities for your business
- Potential threats to monitor
- Quick strategic recommendations

**Status**: Weekly brief in progress... Refresh this page to see results.`;
            }

            // If summary exists but failed, try to regenerate it
            if (summaryRecord.status === "failed") {
               if (competitors.length === 0) {
                  return `# Weekly Competitive Brief

*No competitors found. Add competitors to generate your weekly competitive insights.*

## Getting Started
1. Add competitors to your organization
2. We'll automatically generate your weekly strategic brief
3. Check back here for actionable weekly insights

**Note**: Start by adding your main competitors to get valuable weekly briefings.`;
               }

               // Update status to pending for retry
               await updateCompetitorSummary(resolvedCtx.db, summaryRecord.id, {
                  status: "pending",
                  errorMessage: null,
               });

               // Enqueue background job to regenerate
               await enqueueCreateCompetitorSummaryJob({
                  organizationId,
                  userId,
                  summaryId: summaryRecord.id,
                  runtimeContext: {
                     language: resolvedCtx.language,
                     userId,
                  },
               });

               // Return placeholder while regenerating
               return `# Weekly Competitive Brief

*Regenerating your weekly competitive insights... Please check back in a few minutes.*

## Current Competitors
Analyzing **${competitors.length}** competitors for this week's strategic brief.

## Previous Error
${summaryRecord.errorMessage || "Unknown error occurred"}

**Status**: Regenerating weekly brief... Refresh this page to see results.`;
            }

            // If summary is still pending, show progress placeholder
            if (
               summaryRecord.status === "pending" ||
               summaryRecord.status === "generating"
            ) {
               return `# Weekly Competitive Brief

*Generating your weekly competitive insights... Please check back in a few minutes.*

## Current Competitors
Analyzing **${competitors.length}** competitors for this week's strategic brief.

## What's Coming
- Key competitor moves to watch this week
- Actionable opportunities for your business
- Potential threats to monitor
- Quick strategic recommendations

**Status**: ${summaryRecord.status === "pending" ? "Queued for analysis" : "Analysis in progress"}... Refresh this page to see results.`;
            }

            // Return the completed summary
            return (
               summaryRecord.summary ||
               `# Weekly Competitive Brief

*Weekly brief data incomplete. Please try regenerating.*

**Status**: Brief available but incomplete. Try refreshing to regenerate.`
            );
         } catch (err) {
            console.error("Error getting competitor summary:", err);
            propagateError(err);
            throw APIError.internal("Failed to get competitor summary.");
         }
      }),
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
            await enqueueCreateCompleteKnowledgeWorkflowJob({
               id: created.id,
               target: "competitor",
               userId,
               websiteUrl: input.websiteUrl,
               runtimeContext: {
                  language: resolvedCtx.language,
                  userId,
               },
            });

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

            await enqueueCreateFeaturesKnowledgeJob({
               id: competitor.id,
               target: "competitor",
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
   onStatusChange: publicProcedure
      .input(z.object({ competitorId: z.string().optional() }).optional())
      .subscription(async function* (opts) {
         for await (const [payload] of on(
            eventEmitter,
            EVENTS.competitorStatus,
            {
               signal: opts.signal,
            },
         )) {
            const event = payload as CompetitorStatusChangedPayload;
            if (
               !opts.input?.competitorId ||
               opts.input.competitorId === event.competitorId
            ) {
               yield event;
            }
         }
      }),
});
