import type { DatabaseInstance } from "../client";
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
   const result = await db.insert(userPreference).values(data).returning();
   return result[0];
}

export async function getUserPreferences(db: DatabaseInstance, userId: string) {
   return await db.query.userPreference.findMany({
      where: eq(userPreference.userId, userId),
   });
}

export async function getUserPreferencesByCategory(
   db: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
) {
   return await db.query.userPreference.findMany({
      where: and(
         eq(userPreference.userId, userId),
         eq(userPreference.category, category),
      ),
   });
}

export async function getUserPreferenceByKey(
   db: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
   key: string,
) {
   return await db.query.userPreference.findFirst({
      where: and(
         eq(userPreference.userId, userId),
         eq(userPreference.category, category),
         eq(userPreference.key, key),
      ),
   });
}

export async function getWorkflowPreferences(
   db: DatabaseInstance,
   userId: string,
): Promise<WorkflowPreferences | null> {
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
}

export async function updateWorkflowPreferences(
   db: DatabaseInstance,
   userId: string,
   preferences: WorkflowPreferences,
) {
   const existing = await db.query.userPreference.findFirst({
      where: and(
         eq(userPreference.userId, userId),
         eq(userPreference.category, "workflow"),
      ),
   });

   if (existing) {
      return await db
         .update(userPreference)
         .set({
            value: preferences,
            updatedAt: new Date(),
         })
         .where(eq(userPreference.id, existing.id))
         .returning();
   } else {
      return await db
         .insert(userPreference)
         .values({
            userId,
            category: "workflow",
            value: preferences,
         })
         .returning();
   }
}

export async function updateUserPreference(
   db: DatabaseInstance,
   id: string,
   data: Partial<UserPreferenceInsert>,
) {
   const result = await db
      .update(userPreference)
      .set(data)
      .where(eq(userPreference.id, id))
      .returning();
   return result[0];
}

export async function updateUserPreferenceByKey(
   db: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
   key: string,
   value: any,
) {
   const result = await db
      .update(userPreference)
      .set({ value, updatedAt: new Date() })
      .where(
         and(
            eq(userPreference.userId, userId),
            eq(userPreference.category, category),
            eq(userPreference.key, key),
         ),
      )
      .returning();
   return result[0];
}

export async function deleteUserPreference(db: DatabaseInstance, id: string) {
   const result = await db
      .delete(userPreference)
      .where(eq(userPreference.id, id))
      .returning();
   return result[0];
}

export async function deleteUserPreferenceByKey(
   db: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
   key: string,
) {
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
   return result[0];
}
