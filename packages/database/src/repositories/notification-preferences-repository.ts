import { notificationPreferences } from "../schemas/notification-preferences";
import type {
   NotificationPreferences,
   NotificationPreferencesInsert,
} from "../schemas/notification-preferences";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq } from "drizzle-orm";

export async function createNotificationPreferences(
   dbClient: DatabaseInstance,
   data: NotificationPreferencesInsert,
): Promise<NotificationPreferences> {
   try {
      const result = await dbClient
         .insert(notificationPreferences)
         .values(data)
         .returning();
      const created = result?.[0];
      if (!created)
         throw new NotFoundError("NotificationPreferences not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create notification preferences: ${(err as Error).message}`,
      );
   }
}

export async function getNotificationPreferencesById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<NotificationPreferences> {
   try {
      const result = await dbClient.query.notificationPreferences.findFirst({
         where: eq(notificationPreferences.id, id),
      });
      if (!result) throw new NotFoundError("NotificationPreferences not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get notification preferences: ${(err as Error).message}`,
      );
   }
}

export async function getNotificationPreferencesByUserAndType(
   dbClient: DatabaseInstance,
   userId: string,
   type: string,
): Promise<NotificationPreferences | null> {
   try {
      const result = await dbClient.query.notificationPreferences.findFirst({
         where: (row) => eq(row.userId, userId) && eq(row.type, type),
      });
      return result ?? null;
   } catch (err) {
      throw new DatabaseError(
         `Failed to get notification preferences: ${(err as Error).message}`,
      );
   }
}

export async function updateNotificationPreferences(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<NotificationPreferencesInsert>,
): Promise<NotificationPreferences> {
   try {
      const result = await dbClient
         .update(notificationPreferences)
         .set(data)
         .where(eq(notificationPreferences.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated)
         throw new NotFoundError("NotificationPreferences not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update notification preferences: ${(err as Error).message}`,
      );
   }
}

export async function deleteNotificationPreferences(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(notificationPreferences)
         .where(eq(notificationPreferences.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted)
         throw new NotFoundError("NotificationPreferences not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete notification preferences: ${(err as Error).message}`,
      );
   }
}

export async function listNotificationPreferences(
   dbClient: DatabaseInstance,
   userId?: string,
): Promise<NotificationPreferences[]> {
   try {
      if (userId) {
         return await dbClient.query.notificationPreferences.findMany({
            where: eq(notificationPreferences.userId, userId),
         });
      }
      return await dbClient.query.notificationPreferences.findMany();
   } catch (err) {
      throw new DatabaseError(
         `Failed to list notification preferences: ${(err as Error).message}`,
      );
   }
}
