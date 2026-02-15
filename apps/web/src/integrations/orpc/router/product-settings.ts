import { ORPCError } from "@orpc/server";
import {
   getProductSettings,
   updateAiDefaults as updateAiDefaultsRepo,
   updateContentDefaults as updateContentDefaultsRepo,
   updateFormsDefaults as updateFormsDefaultsRepo,
} from "@packages/database/repositories/product-settings-repository";
import {
   AIDefaultsSchema,
   ContentDefaultsSchema,
   FormsDefaultsSchema,
} from "@packages/database/schemas/product-settings";
import { protectedProcedure } from "../server";

// =============================================================================
// Procedures
// =============================================================================

/**
 * Get product settings for the current team.
 * Returns null if no settings exist yet.
 */
export const getSettings = protectedProcedure.handler(async ({ context }) => {
   const { db, teamId } = context;

   try {
      return await getProductSettings(db, teamId);
   } catch (err) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
         message:
            err instanceof Error
               ? err.message
               : "Failed to get product settings",
      });
   }
});

/**
 * Update content defaults for the current team.
 * Merges new data with existing contentDefaults if settings exist.
 */
export const updateContentDefaults = protectedProcedure
   .input(ContentDefaultsSchema.partial())
   .handler(async ({ context, input }) => {
      const { db, teamId } = context;

      try {
         return await updateContentDefaultsRepo(db, teamId, input);
      } catch (err) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message:
               err instanceof Error
                  ? err.message
                  : "Failed to update content defaults",
         });
      }
   });

/**
 * Update forms defaults for the current team.
 * Merges new data with existing formsDefaults if settings exist.
 */
export const updateFormsDefaults = protectedProcedure
   .input(FormsDefaultsSchema.partial())
   .handler(async ({ context, input }) => {
      const { db, teamId } = context;

      try {
         return await updateFormsDefaultsRepo(db, teamId, input);
      } catch (err) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message:
               err instanceof Error
                  ? err.message
                  : "Failed to update forms defaults",
         });
      }
   });

/**
 * Update AI defaults for the current team.
 * Merges new data with existing aiDefaults if settings exist.
 */
export const updateAiDefaults = protectedProcedure
   .input(AIDefaultsSchema.partial())
   .handler(async ({ context, input }) => {
      const { db, teamId } = context;

      try {
         return await updateAiDefaultsRepo(db, teamId, input);
      } catch (err) {
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message:
               err instanceof Error
                  ? err.message
                  : "Failed to update AI defaults",
         });
      }
   });
