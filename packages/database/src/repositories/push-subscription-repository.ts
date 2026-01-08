import { AppError, propagateError } from "@packages/utils/errors";
import { and, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { pushSubscription } from "../schemas/push-subscriptions";

export type PushSubscription = typeof pushSubscription.$inferSelect;
export type NewPushSubscription = typeof pushSubscription.$inferInsert;

export interface PushSubscriptionKeys {
   endpoint: string;
   p256dh: string;
   auth: string;
}

export async function createPushSubscription(
   dbClient: DatabaseInstance,
   data: NewPushSubscription,
): Promise<PushSubscription> {
   try {
      // Use onConflictDoUpdate to avoid race condition
      // This is atomic and uses the unique constraint on endpoint
      const result = await dbClient
         .insert(pushSubscription)
         .values(data)
         .onConflictDoUpdate({
            target: pushSubscription.endpoint,
            set: {
               auth: data.auth,
               p256dh: data.p256dh,
               updatedAt: new Date(),
               userAgent: data.userAgent,
               userId: data.userId,
            },
         })
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to upsert push subscription");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create push subscription: ${(err as Error).message}`,
      );
   }
}

export async function findPushSubscriptionsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
): Promise<PushSubscription[]> {
   try {
      return await dbClient.query.pushSubscription.findMany({
         orderBy: (sub, { desc }) => desc(sub.createdAt),
         where: (sub, { eq }) => eq(sub.userId, userId),
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find push subscriptions: ${(err as Error).message}`,
      );
   }
}

export async function findPushSubscriptionByEndpoint(
   dbClient: DatabaseInstance,
   endpoint: string,
): Promise<PushSubscription | undefined> {
   try {
      return await dbClient.query.pushSubscription.findFirst({
         where: (sub, { eq }) => eq(sub.endpoint, endpoint),
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to find push subscription: ${(err as Error).message}`,
      );
   }
}

export async function deletePushSubscription(
   dbClient: DatabaseInstance,
   endpoint: string,
): Promise<void> {
   try {
      await dbClient
         .delete(pushSubscription)
         .where(eq(pushSubscription.endpoint, endpoint));
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete push subscription: ${(err as Error).message}`,
      );
   }
}

export async function deletePushSubscriptionByUserAndEndpoint(
   dbClient: DatabaseInstance,
   userId: string,
   endpoint: string,
): Promise<void> {
   try {
      await dbClient
         .delete(pushSubscription)
         .where(
            and(
               eq(pushSubscription.userId, userId),
               eq(pushSubscription.endpoint, endpoint),
            ),
         );
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete push subscription: ${(err as Error).message}`,
      );
   }
}

export async function deleteAllPushSubscriptionsByUserId(
   dbClient: DatabaseInstance,
   userId: string,
): Promise<void> {
   try {
      await dbClient
         .delete(pushSubscription)
         .where(eq(pushSubscription.userId, userId));
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete push subscriptions: ${(err as Error).message}`,
      );
   }
}
