import {
  createNotificationPreferences,
  getNotificationPreferencesById,
  updateNotificationPreferences,
  deleteNotificationPreferences,
  listNotificationPreferences,
  getNotificationPreferencesByUserAndType,
} from "@packages/database/repositories/notification-preferences-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";
import { protectedProcedure, router } from "../trpc";

const CreateNotificationPreferencesInput = Type.Object({
  userId: Type.String(),
  type: Type.String(),
  enabled: Type.Optional(Type.Boolean()),
});

const UpdateNotificationPreferencesInput = Type.Object({
  id: Type.String({ format: "uuid" }),
  userId: Type.Optional(Type.String()),
  type: Type.Optional(Type.String()),
  enabled: Type.Optional(Type.Boolean()),
});

const DeleteNotificationPreferencesInput = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const GetNotificationPreferencesInput = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const ListNotificationPreferencesInput = Type.Object({
  userId: Type.Optional(Type.String()),
});

const GetByUserAndTypeInput = Type.Object({
  userId: Type.String(),
  type: Type.String(),
});

export const notificationPreferencesRouter = router({
  create: protectedProcedure
    .input(wrap(CreateNotificationPreferencesInput))
    .mutation(async ({ ctx, input }) => {
      try {
        return await createNotificationPreferences(ctx.db, input);
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
    .input(wrap(UpdateNotificationPreferencesInput))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateFields } = input;
      try {
        await updateNotificationPreferences(ctx.db, id, updateFields);
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
    .input(wrap(DeleteNotificationPreferencesInput))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      try {
        await deleteNotificationPreferences(ctx.db, id);
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
    .input(wrap(GetNotificationPreferencesInput))
    .query(async ({ ctx, input }) => {
      try {
        return await getNotificationPreferencesById(ctx.db, input.id);
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
    .input(wrap(ListNotificationPreferencesInput))
    .query(async ({ ctx, input }) => {
      try {
        return await listNotificationPreferences(ctx.db, input.userId);
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
  getByUserAndType: protectedProcedure
    .input(wrap(GetByUserAndTypeInput))
    .query(async ({ ctx, input }) => {
      try {
        return await getNotificationPreferencesByUserAndType(
          ctx.db,
          input.userId,
          input.type,
        );
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
