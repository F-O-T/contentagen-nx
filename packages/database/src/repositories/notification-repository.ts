import { notification } from "../schemas/notification";
import type { Notification, NotificationInsert } from "../schemas/notification";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq } from "drizzle-orm";

export async function createNotification(
  dbClient: DatabaseInstance,
  data: NotificationInsert,
): Promise<Notification> {
  try {
    const result = await dbClient.insert(notification).values(data).returning();
    const created = result?.[0];
    if (!created) throw new NotFoundError("Notification not created");
    return created;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
      `Failed to create notification: ${(err as Error).message}`,
    );
  }
}

export async function getNotificationById(
  dbClient: DatabaseInstance,
  id: string,
): Promise<Notification> {
  try {
    const result = await dbClient.query.notification.findFirst({
      where: eq(notification.id, id),
    });
    if (!result) throw new NotFoundError("Notification not found");
    return result;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
      `Failed to get notification: ${(err as Error).message}`,
    );
  }
}

export async function updateNotification(
  dbClient: DatabaseInstance,
  id: string,
  data: Partial<NotificationInsert>,
): Promise<Notification> {
  try {
    const result = await dbClient
      .update(notification)
      .set(data)
      .where(eq(notification.id, id))
      .returning();
    const updated = result?.[0];
    if (!updated) throw new NotFoundError("Notification not found");
    return updated;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
      `Failed to update notification: ${(err as Error).message}`,
    );
  }
}

export async function deleteNotification(
  dbClient: DatabaseInstance,
  id: string,
): Promise<void> {
  try {
    const result = await dbClient
      .delete(notification)
      .where(eq(notification.id, id))
      .returning();
    const deleted = result?.[0];
    if (!deleted) throw new NotFoundError("Notification not found");
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
      `Failed to delete notification: ${(err as Error).message}`,
    );
  }
}

export async function listNotifications(
  dbClient: DatabaseInstance,
  userId?: string,
): Promise<Notification[]> {
  try {
    if (userId) {
      return await dbClient.query.notification.findMany({
        where: eq(notification.userId, userId),
      });
    }
    return await dbClient.query.notification.findMany();
  } catch (err) {
    throw new DatabaseError(
      `Failed to list notifications: ${(err as Error).message}`,
    );
  }
}
