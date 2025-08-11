import { contentGenerationQueue } from "@packages/workers/queues/content-generation";
import {
   createContent,
   getContentById,
   updateContent,
   deleteContent,
   listContents,
   getContentsByUserId,
} from "@packages/database/repositories/content-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../trpc";
import {
   ContentInsertSchema,
   ContentUpdateSchema,
   ContentSelectSchema,
} from "@packages/database/schema";

export const contentRouter = router({
   addImageUrl: protectedProcedure
      .input(ContentUpdateSchema.pick({ id: true, imageUrl: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id || !input.imageUrl) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID and image URL are required.",
               });
            }
            const db = (await ctx).db;
            const updated = await updateContent(db, input.id, {
               imageUrl: input.imageUrl,
            });
            return { success: true, content: updated };
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
   create: protectedProcedure
      .input(
         ContentInsertSchema.pick({
            agentId: true, // agentId is required for creation
            request: true, // request is required for creation
         }),
      )
      .output(ContentInsertSchema)
      .mutation(async ({ ctx, input }) => {
         try {
            const userId = (await ctx).session?.user.id;
            if (!userId) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to create content.",
               });
            }
            const created = await createContent((await ctx).db, {
               ...input,
               userId, // Use authenticated user ID
            });
            await contentGenerationQueue.add("content-generation-workflow", {
               agentId: input.agentId,
               contentId: created.id,
               contentRequest: {
                  description: input.request.description,
               },
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
      .input(ContentUpdateSchema)
      .mutation(async ({ ctx, input }) => {
         const { id, ...updateFields } = input;
         if (!id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Content ID is required for update.",
            });
         }
         try {
            await updateContent((await ctx).db, id, updateFields);
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
   delete: protectedProcedure
      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         try {
            if (!id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }

            await deleteContent((await ctx).db, id);
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
      .input(ContentInsertSchema.pick({ id: true }))
      .query(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }
            return await getContentById((await ctx).db, input.id);
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
   list: protectedProcedure
      .input(
         z.object({
            agentId: ContentSelectSchema.shape.agentId,
            status: ContentSelectSchema.shape.status.array().min(1),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            if (!resolvedCtx.session?.user.id) {
               throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "User must be authenticated to list content.",
               });
            }
            if (!input.status || input.status.length === 0) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "At least one status is required to list content.",
               });
            }
            const filteredStatus = input.status.filter(
               (s): s is NonNullable<typeof s> => s !== null,
            );
            const contents = await listContents(
               resolvedCtx.db,
               input.agentId,
               filteredStatus,
            );
            return contents;
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
   listByUserId: protectedProcedure.query(async ({ ctx }) => {
      try {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         if (!userId) {
            throw new TRPCError({
               code: "UNAUTHORIZED",
               message: "User must be authenticated to list content by user.",
            });
         }
         const contents = await getContentsByUserId(resolvedCtx.db, userId);
         return contents;
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
   approve: protectedProcedure
      .input(ContentInsertSchema.pick({ id: true }))
      .mutation(async ({ ctx, input }) => {
         try {
            if (!input.id) {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Content ID is required.",
               });
            }
            const db = (await ctx).db;
            const content = await getContentById(db, input.id);
            if (!content) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Content not found.",
               });
            }
            if (content.status !== "draft") {
               throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Only draft content can be approved.",
               });
            }
            await updateContent(db, input.id, { status: "approved" });
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
});
