import {
   listEventCatalog,
   updateEventCatalogEntry,
} from "@packages/database/repositories/event-catalog-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const updateEventCatalogSchema = z.object({
   id: z.string().uuid(),
   description: z.string().optional(),
   displayName: z.string().optional(),
   isActive: z.boolean().optional(),
});

// =============================================================================
// Event Catalog Procedures
// =============================================================================

export const list = protectedProcedure.handler(async ({ context }) => {
   const { db } = context;

   return await listEventCatalog(db);
});

export const update = protectedProcedure
   .input(updateEventCatalogSchema)
   .handler(async ({ context, input }) => {
      const { db } = context;

      const { id: _id, ...updateData } = input;
      const updated = await updateEventCatalogEntry(db, input.id, updateData);

      return updated;
   });
