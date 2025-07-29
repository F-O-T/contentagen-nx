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
    .input(CreateContentInput)
    .output(ContentInsertSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await createContent((await ctx).db, input);
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
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const contents = await listContents((await ctx).db);
      // Only return the description for each content request
      return contents.map((item) => ({
        id: item.id,
        description: item.request?.briefDescription,
        // add other fields if needed
      }));
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
