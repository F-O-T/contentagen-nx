import {
   createContent,
   getContentById,
   updateContent,
   deleteContent,
   listContents,
} from "@packages/database/repositories/content-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";

import { protectedProcedure, router } from "../trpc";
import {
   ContentInsertSchema,
   ContentUpdateSchema,
} from "@packages/database/schema";

const CreateContentInput = ContentInsertSchema;
const UpdateContentInput = ContentUpdateSchema;

const DeleteContentInput = Type.Object({
   id: Type.String({ format: "uuid" }),
});

const GetContentInput = Type.Object({
   id: Type.String({ format: "uuid" }),
});

export const contentRouter = router({
   create: protectedProcedure
      .input(wrap(CreateContentInput))
      .mutation(async ({ ctx, input }) => {
         try {
            return await createContent(ctx.db, input);
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
      .input(wrap(UpdateContentInput))
      .mutation(async ({ ctx, input }) => {
         const { id, ...updateFields } = input;
         if (!id) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Content ID is required for update.",
            });
         }
         try {
            await updateContent(ctx.db, id, updateFields);
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
      .input(wrap(DeleteContentInput))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         try {
            await deleteContent(ctx.db, id);
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
      .input(wrap(GetContentInput))
      .query(async ({ ctx, input }) => {
         try {
            return await getContentById(ctx.db, input.id);
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
         return await listContents(ctx.db);
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
