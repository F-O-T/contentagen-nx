import { protectedProcedure, router, organizationProcedure } from "../trpc";
import { CompetitorInsertSchema } from "@packages/database/schema";
import {
   createCompetitor,
   getCompetitorById,
   updateCompetitor,
   deleteCompetitor,
   listCompetitors,
   searchCompetitors,
} from "@packages/database/repositories/competitor-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { enqueueCompetitorCrawlJob } from "@packages/workers/queues/competitors/competitor-crawl-queue";

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
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to list competitors.",
               });
            }

            if (input.search) {
               const competitors = await searchCompetitors(resolvedCtx.db, {
                  query: input.search,
                  userId,
                  organizationId: organizationId || undefined,
                  page: input.page,
                  limit: input.limit,
               });
               return { items: competitors };
            }

            const competitors = await listCompetitors(resolvedCtx.db, {
               userId,
               organizationId: organizationId || undefined,
               page: input.page,
               limit: input.limit,
            });
            return { items: competitors };
         } catch (err) {
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),

   create: organizationProcedure
      .input(
         CompetitorInsertSchema.pick({
            name: true,
            websiteUrl: true,
            changelogUrl: true,
         }).partial({
            changelogUrl: true,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message:
                     "User must be authenticated and belong to an organization to create competitors.",
               });
            }

            const created = await createCompetitor(resolvedCtx.db, {
               ...input,
               userId,
               organizationId,
            });

            // Enqueue competitor analysis job
            await enqueueCompetitorCrawlJob({
               competitorId: created.id,
               userId,
               organizationId,
               websiteUrl: input.websiteUrl,
            });

            return created;
         } catch (err) {
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),

   update: protectedProcedure
      .input(
         z.object({
            id: z.string().uuid(),
            data: CompetitorInsertSchema.pick({
               name: true,
               websiteUrl: true,
               changelogUrl: true,
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
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to update competitors.",
               });
            }

            // Verify the competitor exists and belongs to the user/organization
            const existing = await getCompetitorById(resolvedCtx.db, input.id);
            if (
               existing.userId !== userId &&
               existing.organizationId !== organizationId
            ) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message:
                     "You don't have permission to update this competitor.",
               });
            }

            const updated = await updateCompetitor(
               resolvedCtx.db,
               input.id,
               input.data,
            );
            return updated;
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to delete competitors.",
               });
            }

            // Verify the competitor exists and belongs to the user/organization
            const existing = await getCompetitorById(resolvedCtx.db, input.id);
            if (
               existing.userId !== userId &&
               existing.organizationId !== organizationId
            ) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message:
                     "You don't have permission to delete this competitor.",
               });
            }

            await deleteCompetitor(resolvedCtx.db, input.id);
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),

   analyze: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to analyze competitors.",
               });
            }

            const competitor = await getCompetitorById(resolvedCtx.db, input.id);

            // Verify the competitor belongs to the user/organization
            if (
               competitor.userId !== userId &&
               competitor.organizationId !== organizationId
            ) {
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "You don't have permission to analyze this competitor.",
               });
            }

            // Enqueue competitor analysis job
            await enqueueCompetitorCrawlJob({
               competitorId: competitor.id,
               userId,
               organizationId,
               websiteUrl: competitor.websiteUrl,
            });

            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),

   get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const userId = resolvedCtx.session?.user.id;
            const organizationId =
               resolvedCtx.session?.session?.activeOrganizationId;

            if (!userId || !organizationId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to view competitors.",
               });
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
               throw new TRPCError({
                  code: "FORBIDDEN",
                  message: "You don't have permission to view this competitor.",
               });
            }

            return competitor;
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
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
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to search competitors.",
               });
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
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
});
