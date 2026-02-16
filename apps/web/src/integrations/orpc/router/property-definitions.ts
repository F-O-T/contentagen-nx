import { ORPCError } from "@orpc/server";
import {
   createPropertyDefinition,
   deletePropertyDefinition,
   getPropertyDefinition,
   listPropertyDefinitions,
   updatePropertyDefinition,
} from "@packages/database/repositories/property-definition-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createPropertyDefinitionSchema = z.object({
   name: z.string().min(1),
   type: z.enum(["string", "number", "boolean", "datetime", "array"]),
   description: z.string().optional(),
   eventNames: z.array(z.string()).optional(),
   isNumerical: z.boolean().optional(),
   tags: z.array(z.string()).optional(),
});

const updatePropertyDefinitionSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   type: z
      .enum(["string", "number", "boolean", "datetime", "array"])
      .optional(),
   description: z.string().optional(),
   eventNames: z.array(z.string()).optional(),
   isNumerical: z.boolean().optional(),
   tags: z.array(z.string()).optional(),
});

// =============================================================================
// Property Definition Procedures
// =============================================================================

export const create = protectedProcedure
   .input(createPropertyDefinitionSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await createPropertyDefinition(db, {
         organizationId,
         name: input.name,
         type: input.type,
         description: input.description,
         eventNames: input.eventNames,
         isNumerical: input.isNumerical,
         tags: input.tags,
      });

      return definition;
   });

export const list = protectedProcedure.handler(async ({ context }) => {
   const { organizationId, db } = context;

   return await listPropertyDefinitions(db, organizationId);
});

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await getPropertyDefinition(db, input.id);

      if (!definition || definition.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Definição de propriedade não encontrada.",
         });
      }

      return definition;
   });

export const update = protectedProcedure
   .input(updatePropertyDefinitionSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await getPropertyDefinition(db, input.id);

      if (!definition || definition.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Definição de propriedade não encontrada.",
         });
      }

      const { id: _id, ...updateData } = input;
      const updated = await updatePropertyDefinition(db, input.id, updateData);

      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const definition = await getPropertyDefinition(db, input.id);

      if (!definition || definition.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Definição de propriedade não encontrada.",
         });
      }

      await deletePropertyDefinition(db, input.id);

      return { success: true };
   });
