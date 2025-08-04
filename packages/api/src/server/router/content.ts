import { tasks } from "@packages/tasks";
import type { contentGenerationTask } from "@packages/tasks/workflows/content-generation";
import {
   createContent,
   getContentById,
   updateContent,
   deleteContent,
   listContents,
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

const CreateContentInput = ContentInsertSchema;
const UpdateContentInput = ContentUpdateSchema;

const DeleteContentInput = z.object({
   id: z.string().uuid(),
});

const GetContentInput = z.object({
   id: z.string().uuid(),
});

export const contentRouter = router({
   create: protectedProcedure
      .input(
         CreateContentInput.omit({
            userId: true, // userId is auto-generated
            id: true, // id is auto-generated
            createdAt: true, // createdAt is set automatically
            updatedAt: true, // updatedAt is set automatically
            title: true, // title is required for creation, can be added later
            body: true, // body is optional for creation, can be added later
            meta: true, // meta is optional for creation, can be added later
            stats: true, // stats is optional for creation, can be added later
            status: true, // status is optional for creation, can be set to 'draft'
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
            await tasks.trigger<typeof contentGenerationTask>(
               "content-generation-workflow",
               {
                  agentId: input.agentId,
                  contentId: created.id,
                  contentRequest: {
                     description: input.request.description,
                  },
               },
            );
            // Trigger new content generation pipeline task
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
      .input(UpdateContentInput)
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
      .input(DeleteContentInput)
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         try {
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
      .input(GetContentInput)
      .query(async ({ ctx, input }) => {
         try {
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
         ContentSelectSchema.pick({
            agentId: true,
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
            const contents = await listContents(resolvedCtx.db, input.agentId);
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
});
