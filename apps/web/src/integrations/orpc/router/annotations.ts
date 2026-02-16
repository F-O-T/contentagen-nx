import { ORPCError } from "@orpc/server";
import {
   createAnnotation,
   deleteAnnotation,
   getAnnotation,
   listAnnotations,
   updateAnnotation,
} from "@packages/database/repositories/annotation-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createAnnotationSchema = z.object({
   title: z.string().min(1),
   description: z.string().optional(),
   date: z.coerce.date(),
   scope: z.enum(["global", "content", "forms", "ai"]).optional(),
   metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateAnnotationSchema = z.object({
   id: z.string().uuid(),
   title: z.string().min(1).optional(),
   description: z.string().optional(),
   date: z.coerce.date().optional(),
   scope: z.enum(["global", "content", "forms", "ai"]).optional(),
   metadata: z.record(z.string(), z.unknown()).optional(),
});

const listAnnotationsSchema = z.object({
   page: z.number().min(1).optional().default(1),
   limit: z.number().min(1).max(100).optional().default(50),
   from: z.coerce.date().optional(),
   to: z.coerce.date().optional(),
});

// =============================================================================
// Annotation Procedures
// =============================================================================

export const create = protectedProcedure
   .input(createAnnotationSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db, userId } = context;

      const annotation = await createAnnotation(db, {
         organizationId,
         title: input.title,
         description: input.description,
         date: input.date,
         scope: input.scope,
         metadata: input.metadata,
         createdBy: userId,
      });

      return annotation;
   });

export const list = protectedProcedure
   .input(listAnnotationsSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const items = await listAnnotations(db, organizationId, {
         page: input.page,
         limit: input.limit,
         from: input.from,
         to: input.to,
      });

      return { items, page: input.page, limit: input.limit };
   });

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const annotation = await getAnnotation(db, input.id);

      if (!annotation || annotation.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Anotação não encontrada.",
         });
      }

      return annotation;
   });

export const update = protectedProcedure
   .input(updateAnnotationSchema)
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const annotation = await getAnnotation(db, input.id);

      if (!annotation || annotation.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Anotação não encontrada.",
         });
      }

      const { id: _id, ...updateData } = input;
      const updated = await updateAnnotation(db, input.id, updateData);

      return updated;
   });

export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, db } = context;

      const annotation = await getAnnotation(db, input.id);

      if (!annotation || annotation.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", {
            message: "Anotação não encontrada.",
         });
      }

      await deleteAnnotation(db, input.id);

      return { success: true };
   });
