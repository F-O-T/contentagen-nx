import { AppError, propagateError } from "@packages/utils/errors";
import { desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { actions, type NewAction } from "../schemas/actions";

export async function createAction(
   db: DatabaseInstance,
   data: Omit<NewAction, "id" | "createdAt" | "updatedAt">,
) {
   try {
      const [action] = await db.insert(actions).values(data).returning();

      return action;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create action");
   }
}

export async function listActions(
   db: DatabaseInstance,
   organizationId: string,
) {
   try {
      return await db
         .select()
         .from(actions)
         .where(eq(actions.organizationId, organizationId))
         .orderBy(desc(actions.createdAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list actions");
   }
}

export async function getAction(db: DatabaseInstance, id: string) {
   try {
      const [action] = await db
         .select()
         .from(actions)
         .where(eq(actions.id, id))
         .limit(1);

      return action ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get action");
   }
}

export async function updateAction(
   db: DatabaseInstance,
   id: string,
   data: Partial<
      Pick<
         NewAction,
         "name" | "description" | "eventPatterns" | "matchType" | "isActive"
      >
   >,
) {
   try {
      const [updated] = await db
         .update(actions)
         .set(data)
         .where(eq(actions.id, id))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update action");
   }
}

export async function deleteAction(db: DatabaseInstance, id: string) {
   try {
      await db.delete(actions).where(eq(actions.id, id));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete action");
   }
}
