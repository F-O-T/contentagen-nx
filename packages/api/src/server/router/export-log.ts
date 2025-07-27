import {
   createExportLog,
   getExportLogById,
   updateExportLog,
   deleteExportLog,
   listExportLogs,
} from "@packages/database/repositories/export-log-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";
import { protectedProcedure, router } from "../trpc";

import {
   ExportLogOptionsSchema,
   ExportLogSelectSchema,
} from "@packages/database/schema";

const CreateExportLogInput = Type.Object({
   contentId: Type.String({ format: "uuid" }),
   userId: Type.String(),
   options: ExportLogOptionsSchema,
});

const UpdateExportLogInput = Type.Object({
   id: Type.String({ format: "uuid" }),
   contentId: Type.Optional(Type.String({ format: "uuid" })),
   userId: Type.Optional(Type.String()),
   options: Type.Optional(ExportLogOptionsSchema),
});

const DeleteExportLogInput = Type.Object({
   id: Type.String({ format: "uuid" }),
});

const GetExportLogInput = Type.Object({
   id: Type.String({ format: "uuid" }),
});

export const exportLogRouter = router({
   create: protectedProcedure
      .input(wrap(CreateExportLogInput))
      .output(wrap(ExportLogSelectSchema))
      .mutation(async ({ ctx, input }) => {
         try {
            return await createExportLog(ctx.db, input);
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
      .input(wrap(UpdateExportLogInput))
      .mutation(async ({ ctx, input }) => {
         const { id, ...updateFields } = input;
         try {
            await updateExportLog(ctx.db, id, updateFields);
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
      .input(wrap(DeleteExportLogInput))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         try {
            await deleteExportLog(ctx.db, id);
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
      .input(wrap(GetExportLogInput))
      .output(wrap(ExportLogSelectSchema))
      .query(async ({ ctx, input }) => {
         try {
            return await getExportLogById(ctx.db, input.id);
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
      .output(wrap(Type.Array(ExportLogSelectSchema)))
      .query(async ({ ctx }) => {
         try {
            return await listExportLogs(ctx.db);
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
