import {
   findNotificationsByUserId,
   findUnreadNotificationsByUserId,
   markNotificationAsRead,
} from "@packages/database/repositories/notification-repository";
import { APIError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const notificationRouter = router({
   list: protectedProcedure
      .input(
         z
            .object({
               onlyUnread: z.boolean().default(true),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw APIError.unauthorized("Unauthorized");
         }

         if (input?.onlyUnread !== false) {
            return findUnreadNotificationsByUserId(resolvedCtx.db, userId);
         }
         return findNotificationsByUserId(resolvedCtx.db, userId);
      }),

   markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;

         if (!userId) {
            throw APIError.unauthorized("Unauthorized");
         }

         // Get all notifications for this user to verify ownership
         const userNotifications = await findNotificationsByUserId(
            resolvedCtx.db,
            userId,
         );

         const notificationBelongsToUser = userNotifications.some(
            (n) => n.id === input.id,
         );

         if (!notificationBelongsToUser) {
            throw APIError.forbidden(
               "You don't have permission to modify this notification.",
            );
         }

         return markNotificationAsRead(resolvedCtx.db, input.id);
      }),
});
