import {
  createNotification,
  getNotificationById,
  updateNotification,
  deleteNotification,
  listNotifications,
} from "@packages/database/repositories/notification-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";
import { protectedProcedure, router } from "../trpc";

import {
  NotificationInsertSchema,
  NotificationUpdateSchema,
} from "@packages/database/schema";

const CreateNotificationInput = NotificationInsertSchema;
const UpdateNotificationInput = NotificationUpdateSchema;

const DeleteNotificationInput = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const GetNotificationInput = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const ListNotificationsInput = Type.Object({
  userId: Type.Optional(Type.String()),
});

export const notificationRouter = router({
  create: protectedProcedure
    .input(wrap(CreateNotificationInput))
    .mutation(async ({ ctx, input }) => {
      try {
        const { sentAt, ...rest } = input;
        const repoInput = {
          ...rest,
          ...(sentAt ? { sentAt: new Date(sentAt) } : {}),
        };
        return await createNotification(ctx.db, repoInput);
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
    .input(wrap(UpdateNotificationInput))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateFields } = input;
      try {
        const { sentAt, ...rest } = updateFields;
        const repoInput = {
          ...rest,
          ...(sentAt ? { sentAt: new Date(sentAt) } : {}),
        };
        if (!id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Notification ID is required for update.",
          });
        }
        await updateNotification(ctx.db, id, repoInput);
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
    .input(wrap(DeleteNotificationInput))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      try {
        await deleteNotification(ctx.db, id);
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
    .input(wrap(GetNotificationInput))
    .query(async ({ ctx, input }) => {
      try {
        return await getNotificationById(ctx.db, input.id);
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
    .input(wrap(ListNotificationsInput))
    .query(async ({ ctx, input }) => {
      try {
        return await listNotifications(ctx.db, input.userId);
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
