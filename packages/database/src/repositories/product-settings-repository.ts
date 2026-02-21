import { AppError, propagateError } from "@packages/utils/errors";
import { sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type AIDefaults,
   AIDefaultsSchema,
   type ContentDefaults,
   ContentDefaultsSchema,
   type FormsDefaults,
   FormsDefaultsSchema,
   type ProductSettings,
   productSettings,
} from "../schemas/product-settings";

/**
 * Get product settings for a team
 * Returns null if no settings exist yet
 */
export async function getProductSettings(
   db: DatabaseInstance,
   teamId: string,
): Promise<ProductSettings | null> {
   try {
      const result = await db.query.productSettings.findFirst({
         where: (ps, { eq }) => eq(ps.teamId, teamId),
      });

      return result ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get product settings: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
   }
}

/**
 * Upsert content defaults for a team
 * Merges new data with existing contentDefaults if settings exist
 */
export async function updateContentDefaults(
   db: DatabaseInstance,
   teamId: string,
   data: Partial<ContentDefaults>,
): Promise<ProductSettings> {
   try {
      // Validate input data
      ContentDefaultsSchema.partial().parse(data);

      const result = await db
         .insert(productSettings)
         .values({
            teamId,
            contentDefaults: data,
         })
         .onConflictDoUpdate({
            target: productSettings.teamId,
            set: {
               contentDefaults: sql`${productSettings.contentDefaults} || ${JSON.stringify(data)}::jsonb`,
               updatedAt: new Date(),
            },
         })
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to update content defaults");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update content defaults: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
   }
}

/**
 * Upsert forms defaults for a team
 * Merges new data with existing formsDefaults if settings exist
 */
export async function updateFormsDefaults(
   db: DatabaseInstance,
   teamId: string,
   data: Partial<FormsDefaults>,
): Promise<ProductSettings> {
   try {
      // Validate input data
      FormsDefaultsSchema.partial().parse(data);

      const result = await db
         .insert(productSettings)
         .values({
            teamId,
            formsDefaults: data,
         })
         .onConflictDoUpdate({
            target: productSettings.teamId,
            set: {
               formsDefaults: sql`${productSettings.formsDefaults} || ${JSON.stringify(data)}::jsonb`,
               updatedAt: new Date(),
            },
         })
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to update forms defaults");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update forms defaults: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
   }
}

/**
 * Upsert AI defaults for a team
 * Merges new data with existing aiDefaults if settings exist
 */
export async function updateAiDefaults(
   db: DatabaseInstance,
   teamId: string,
   data: Partial<AIDefaults>,
): Promise<ProductSettings> {
   try {
      // Validate input data
      AIDefaultsSchema.partial().parse(data);

      const result = await db
         .insert(productSettings)
         .values({
            teamId,
            aiDefaults: data,
         })
         .onConflictDoUpdate({
            target: productSettings.teamId,
            set: {
               aiDefaults: sql`${productSettings.aiDefaults} || ${JSON.stringify(data)}::jsonb`,
               updatedAt: new Date(),
            },
         })
         .returning();

      if (!result[0]) {
         throw AppError.database("Failed to update AI defaults");
      }

      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update AI defaults: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
   }
}
