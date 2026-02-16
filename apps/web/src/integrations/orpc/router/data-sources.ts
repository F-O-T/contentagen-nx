import { ORPCError } from "@orpc/server";
import {
   createDataSource,
   deleteDataSource,
   getDataSource,
   listDataSources,
   updateDataSource,
} from "@packages/database/repositories/data-source-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createDataSourceSchema = z.object({
   name: z.string().min(1),
   type: z.enum(["sdk", "mcp", "webhook"]),
   description: z.string().optional(),
   config: z.record(z.string(), z.unknown()).optional(),
});

const updateDataSourceSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   description: z.string().optional(),
   config: z.record(z.string(), z.unknown()).optional(),
   isActive: z.boolean().optional(),
});

// =============================================================================
// Data Source Procedures
// =============================================================================

export const create = protectedProcedure
   .input(createDataSourceSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const source = await createDataSource(db, {
         organizationId,
         name: input.name,
         type: input.type,
         description: input.description,
         config: input.config,
      });

      return source;
   });

export const list = protectedProcedure.handler(async ({ context }) => {
   const { organizationId, db } = context;

   return await listDataSources(db, organizationId);
});

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const source = await getDataSource(db, input.id);

      if (!source || source.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Fonte de dados não encontrada.",
         });
      }

      return source;
   });

export const update = protectedProcedure
   .input(updateDataSourceSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const source = await getDataSource(db, input.id);

      if (!source || source.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Fonte de dados não encontrada.",
         });
      }

      const { id: _id, ...updateData } = input;
      const updated = await updateDataSource(db, input.id, updateData);

      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const source = await getDataSource(db, input.id);

      if (!source || source.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Fonte de dados não encontrada.",
         });
      }

      await deleteDataSource(db, input.id);

      return { success: true };
   });
