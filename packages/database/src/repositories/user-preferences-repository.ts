import type { DatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";
import {
   userPreference,
   type PreferenceCategory,
   type WorkflowPreferences,
} from "../schemas/user-preferences";
import { eq, and } from "drizzle-orm";

export type UserPreferenceInsert = typeof userPreference.$inferInsert;
export type UserPreferenceSelect = typeof userPreference.$inferSelect;

export async function createUserPreference(
   db: DatabaseInstance,
   data: UserPreferenceInsert,
) {
   try {
      const result = await db.insert(userPreference).values(data).returning();
      const created = result[0];
      if (!created) throw AppError.database("User preference not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create user preference: ${(err as Error).message}`,
      );
   }
}

export async function getUserPreferences(db: DatabaseInstance, userId: string) {
   try {
      return await db.query.userPreference.findMany({
         where: eq(userPreference.userId, userId),
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get user preferences: ${(err as Error).message}`,
      );
   }
}

export async function getUserPreferencesByCategory(
   db: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
) {
   try {
      return await db.query.userPreference.findMany({
         where: and(
            eq(userPreference.userId, userId),
            eq(userPreference.category, category),
         ),
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get user preferences by category: ${(err as Error).message}`,
      );
   }
}

export async function getUserPreferenceByKey(
   db: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
   key: string,
) {
   try {
      return await db.query.userPreference.findFirst({
         where: and(
            eq(userPreference.userId, userId),
            eq(userPreference.category, category),
            eq(userPreference.key, key),
         ),
      });
   } catch (err) {
      throw AppError.database(
         `Failed to get user preference by key: ${(err as Error).message}`,
      );
   }
}

export async function getWorkflowPreferences(
   db: DatabaseInstance,
   userId: string,
): Promise<WorkflowPreferences | null> {
   try {
      const result = await db.query.userPreference.findFirst({
         where: and(
            eq(userPreference.userId, userId),
            eq(userPreference.category, "workflow"),
         ),
      });

      if (!result) return null;

      // Validate that the value matches the WorkflowPreferences schema
      const workflowPrefs = result.value as WorkflowPreferences;
      return workflowPrefs;
   } catch (err) {
      throw AppError.database(
         `Failed to get workflow preferences: ${(err as Error).message}`,
      );
   }
}

export async function updateWorkflowPreferences(
   db: DatabaseInstance,
   userId: string,
   preferences: WorkflowPreferences,
) {
   try {
      const existing = await db.query.userPreference.findFirst({
         where: and(
            eq(userPreference.userId, userId),
            eq(userPreference.category, "workflow"),
         ),
      });

      if (existing) {
         const result = await db
            .update(userPreference)
            .set({
               value: preferences,
               updatedAt: new Date(),
            })
            .where(eq(userPreference.id, existing.id))
            .returning();
         const updated = result[0];
         if (!updated)
            throw AppError.database("Workflow preference not updated");
         return updated;
      } else {
         const result = await db
            .insert(userPreference)
            .values({
               userId,
               category: "workflow",
               value: preferences,
            })
            .returning();
         const created = result[0];
         if (!created)
            throw AppError.database("Workflow preference not created");
         return created;
      }
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update workflow preferences: ${(err as Error).message}`,
      );
   }
}

export async function updateUserPreference(
   db: DatabaseInstance,
   id: string,
   data: Partial<UserPreferenceInsert>,
) {
   try {
      const result = await db
         .update(userPreference)
         .set(data)
         .where(eq(userPreference.id, id))
         .returning();
      const updated = result[0];
      if (!updated) throw AppError.database("User preference not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update user preference: ${(err as Error).message}`,
      );
   }
}

export async function deleteUserPreference(db: DatabaseInstance, id: string) {
   try {
      const result = await db
         .delete(userPreference)
         .where(eq(userPreference.id, id))
         .returning();
      const deleted = result[0];
      if (!deleted) throw AppError.database("User preference not found");
      return deleted;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete user preference: ${(err as Error).message}`,
      );
   }
}

export async function deleteUserPreferenceByKey(
   db: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
   key: string,
) {
   try {
      const result = await db
         .delete(userPreference)
         .where(
            and(
               eq(userPreference.userId, userId),
               eq(userPreference.category, category),
               eq(userPreference.key, key),
            ),
         )
         .returning();
      const deleted = result[0];
      if (!deleted) throw AppError.database("User preference not found");
      return deleted;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete user preference by key: ${(err as Error).message}`,
      );
   }
}
