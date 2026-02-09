import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type NewPersonalApiKey,
   personalApiKey,
} from "../schemas/personal-api-key";

/**
 * Create a new personal API key.
 */
export async function createKey(db: DatabaseInstance, data: NewPersonalApiKey) {
   try {
      const [key] = await db.insert(personalApiKey).values(data).returning();

      return key;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create personal API key");
   }
}

/**
 * List all personal API keys for a user, ordered by most recent first.
 */
export async function listKeysByUserId(db: DatabaseInstance, userId: string) {
   try {
      return await db
         .select()
         .from(personalApiKey)
         .where(eq(personalApiKey.userId, userId))
         .orderBy(desc(personalApiKey.createdAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list personal API keys");
   }
}

/**
 * Revoke (delete) a personal API key by ID, scoped to the owning user.
 */
export async function revokeKey(
   db: DatabaseInstance,
   keyId: string,
   userId: string,
) {
   try {
      const [deleted] = await db
         .delete(personalApiKey)
         .where(
            and(
               eq(personalApiKey.id, keyId),
               eq(personalApiKey.userId, userId),
            ),
         )
         .returning();

      return deleted ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to revoke personal API key");
   }
}

/**
 * Find a personal API key by its prefix (first 8 chars).
 * Used during API key authentication to locate the key for hash comparison.
 */
export async function findKeyByPrefix(db: DatabaseInstance, prefix: string) {
   try {
      const [key] = await db
         .select()
         .from(personalApiKey)
         .where(eq(personalApiKey.keyPrefix, prefix))
         .limit(1);

      return key ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to find personal API key by prefix");
   }
}

/**
 * Update the lastUsedAt timestamp for a personal API key.
 */
export async function updateLastUsedAt(db: DatabaseInstance, keyId: string) {
   try {
      await db
         .update(personalApiKey)
         .set({ lastUsedAt: new Date() })
         .where(eq(personalApiKey.id, keyId));
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         "Failed to update personal API key last used time",
      );
   }
}
