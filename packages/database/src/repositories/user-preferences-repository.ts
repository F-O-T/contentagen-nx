import { userPreference } from "../schemas/user-preferences";

import type {
   UserPreferenceSelect,
   UserPreferenceInsert,
   PreferenceCategory,
} from "../schemas/user-preferences";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq, and, desc } from "drizzle-orm";

export async function createUserPreference(
   dbClient: DatabaseInstance,
   data: Omit<UserPreferenceInsert, "id" | "createdAt" | "updatedAt">,
): Promise<UserPreferenceSelect> {
   try {
      const result = await dbClient
         .insert(userPreference)
         .values(data)
         .returning();
      const created = result?.[0];
      if (!created) throw new NotFoundError("User preference not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create user preference: ${(err as Error).message}`,
      );
   }
}

export async function getUserPreferenceById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<UserPreferenceSelect> {
   try {
      const result = await dbClient.query.userPreference.findFirst({
         where: eq(userPreference.id, id),
      });
      if (!result) throw new NotFoundError("User preference not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get user preference: ${(err as Error).message}`,
      );
   }
}

export async function updateUserPreference(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<UserPreferenceInsert>,
): Promise<UserPreferenceSelect> {
   try {
      const result = await dbClient
         .update(userPreference)
         .set(data)
         .where(eq(userPreference.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw new NotFoundError("User preference not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update user preference: ${(err as Error).message}`,
      );
   }
}

export async function deleteUserPreference(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(userPreference)
         .where(eq(userPreference.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw new NotFoundError("User preference not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete user preference: ${(err as Error).message}`,
      );
   }
}

export async function getUserPreferences(
   dbClient: DatabaseInstance,
   userId: string,
   category?: PreferenceCategory,
): Promise<UserPreferenceSelect[]> {
   try {
      const conditions = [
         eq(userPreference.userId, userId),
         eq(userPreference.isActive, true),
      ];

      if (category) {
         conditions.push(eq(userPreference.category, category));
      }

      return await dbClient.query.userPreference.findMany({
         where: and(...conditions),
         orderBy: desc(userPreference.createdAt),
      });
   } catch (err) {
      throw new DatabaseError(
         `Failed to get user preferences: ${(err as Error).message}`,
      );
   }
}

export async function getUserPreferenceByKey(
   dbClient: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
   key: string,
): Promise<UserPreferenceSelect | null> {
   try {
      const result = await dbClient.query.userPreference.findFirst({
         where: and(
            eq(userPreference.userId, userId),
            eq(userPreference.category, category),
            eq(userPreference.key, key),
            eq(userPreference.isActive, true),
         ),
      });
      return result || null;
   } catch (err) {
      throw new DatabaseError(
         `Failed to get user preference by key: ${(err as Error).message}`,
      );
   }
}

export async function upsertUserPreference(
   dbClient: DatabaseInstance,
   userId: string,
   category: PreferenceCategory,
   key: string,
   value: any,
   description?: string,
): Promise<UserPreferenceSelect> {
   try {
      // First, try to find existing preference
      const existing = await getUserPreferenceByKey(
         dbClient,
         userId,
         category,
         key,
      );

      if (existing) {
         // Update existing preference
         return await updateUserPreference(dbClient, existing.id, {
            value,
            description,
         });
      } else {
         // Create new preference
         return await createUserPreference(dbClient, {
            userId,
            category,
            key,
            value,
            description,
         });
      }
   } catch (err) {
      throw new DatabaseError(
         `Failed to upsert user preference: ${(err as Error).message}`,
      );
   }
}

export async function deactivateUserPreference(
   dbClient: DatabaseInstance,
   id: string,
): Promise<UserPreferenceSelect> {
   try {
      return await updateUserPreference(dbClient, id, { isActive: false });
   } catch (err) {
      throw new DatabaseError(
         `Failed to deactivate user preference: ${(err as Error).message}`,
      );
   }
}

export async function getAllUserPreferences(
   dbClient: DatabaseInstance,
   userId: string,
): Promise<Record<PreferenceCategory, Record<string, any>>> {
   try {
      const preferences = await getUserPreferences(dbClient, userId);

      const result: Record<PreferenceCategory, Record<string, any>> = {
         global_writing_style: {},
         notification_settings: {},
         productivity: {},
         general: {},
      };

      for (const pref of preferences) {
         if (!result[pref.category]) {
            result[pref.category] = {};
         }
         result[pref.category][pref.key] = pref.value;
      }

      return result;
   } catch (err) {
      throw new DatabaseError(
         `Failed to get all user preferences: ${(err as Error).message}`,
      );
   }
}

export async function getUserWritingStyle(
   dbClient: DatabaseInstance,
   userId: string,
): Promise<string | null> {
   try {
      const writingStylePref = await getUserPreferenceByKey(
         dbClient,
         userId,
         "global_writing_style",
         "writing_style_markdown",
      );

      return writingStylePref ? (writingStylePref.value as string) : null;
   } catch (err) {
      throw new DatabaseError(
         `Failed to get user writing style: ${(err as Error).message}`,
      );
   }
}

export async function saveUserWritingStyle(
   dbClient: DatabaseInstance,
   userId: string,
   markdownContent: string,
): Promise<UserPreferenceSelect> {
   try {
      return await upsertUserPreference(
         dbClient,
         userId,
         "global_writing_style",
         "writing_style_markdown",
         markdownContent,
         "User's writing style preferences in markdown format",
      );
   } catch (err) {
      throw new DatabaseError(
         `Failed to save user writing style: ${(err as Error).message}`,
      );
   }
}
