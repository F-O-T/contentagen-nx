import { ORPCError } from "@orpc/server";
import {
   addWriterInstruction,
   deleteWriterInstruction,
   getWriterInstructions,
   toggleWriterInstructionEnabled,
} from "@packages/database/repositories/writer-instructions-repository";
import {
   createWriter,
   deleteWriter,
   getWriterById,
   getWritersByTeamId,
   updateWriter,
} from "@packages/database/repositories/writer-repository";
import { content } from "@packages/database/schemas/content";
import { CreateInstructionMemorySchema } from "@packages/database/schemas/instruction-memory";
import {
   PersonaMetadataSchema,
   WriterConfigSchema,
} from "@packages/database/schemas/writer";
import { env as serverEnv } from "@packages/environment/server";
import { createEmitFn } from "@packages/events/emit";
import {
   emitWriterCreated,
   emitWriterDeleted,
   emitWriterUpdated,
} from "@packages/events/writer";
import {
   generatePresignedPutUrl,
   getMinioClient,
} from "@packages/files/client";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const createWriterSchema = z.object({
   personaConfig: z.object({
      metadata: PersonaMetadataSchema,
      instructions: WriterConfigSchema.optional(),
   }),
   profilePhotoUrl: z.string().optional(),
});

const updateWriterSchema = z.object({
   id: z.string().uuid(),
   personaConfig: z
      .object({
         metadata: PersonaMetadataSchema,
         instructions: WriterConfigSchema.optional(),
      })
      .optional(),
   profilePhotoUrl: z.string().nullable().optional(),
});

// =============================================================================
// Writer Procedures
// =============================================================================

/**
 * List all writers for the current team
 */
export const list = protectedProcedure.handler(async ({ context }) => {
   const { db, teamId } = context;
   return getWritersByTeamId(db, teamId);
});

/**
 * Get a single writer by ID
 */
export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const writerRecord = await getWriterById(db, input.id);

      if (!writerRecord || writerRecord.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }

      const [countResult, recentContent] = await Promise.all([
         db
            .select({ count: count() })
            .from(content)
            .where(eq(content.writerId, input.id)),
         db
            .select({
               id: content.id,
               meta: content.meta,
               status: content.status,
               createdAt: content.createdAt,
            })
            .from(content)
            .where(eq(content.writerId, input.id))
            .orderBy(desc(content.createdAt))
            .limit(10),
      ]);

      return {
         ...writerRecord,
         contentCount: countResult[0]?.count ?? 0,
         recentContent,
      };
   });

/**
 * Create a new writer
 */
export const create = protectedProcedure
   .input(createWriterSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, teamId, userId, posthog } = context;

      const newWriter = await createWriter(db, {
         organizationId,
         teamId,
         personaConfig: input.personaConfig,
         profilePhotoUrl: input.profilePhotoUrl ?? null,
      });

      try {
         await emitWriterCreated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { writerId: newWriter.id, name: input.personaConfig.metadata.name },
         );
      } catch {
         /* never break main flow */
      }

      return newWriter;
   });

/**
 * Update an existing writer
 */
export const update = protectedProcedure
   .input(updateWriterSchema)
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId, teamId, posthog } = context;

      const existing = await getWriterById(db, input.id);

      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }

      const { id, ...updates } = input;

      const updated = await updateWriter(db, id, updates);

      try {
         await emitWriterUpdated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { writerId: id, changedFields: Object.keys(updates) },
         );
      } catch {
         /* never break main flow */
      }

      return updated;
   });

/**
 * Delete a writer
 */
export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId, teamId, posthog } = context;

      const existing = await getWriterById(db, input.id);

      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }

      const deleted = await deleteWriter(db, input.id);

      try {
         await emitWriterDeleted(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { writerId: input.id },
         );
      } catch {
         /* never break main flow */
      }

      return deleted;
   });

// =============================================================================
// Instruction Procedures
// =============================================================================

export const getInstructions = protectedProcedure
   .input(z.object({ writerId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const writerRecord = await getWriterById(db, input.writerId);
      if (!writerRecord || writerRecord.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }
      return getWriterInstructions(db, input.writerId);
   });

export const addInstruction = protectedProcedure
   .input(
      z.object({
         writerId: z.string().uuid(),
         instruction: CreateInstructionMemorySchema,
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const writerRecord = await getWriterById(db, input.writerId);
      if (!writerRecord || writerRecord.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }
      return addWriterInstruction(db, input.writerId, input.instruction);
   });

export const deleteInstruction = protectedProcedure
   .input(
      z.object({
         writerId: z.string().uuid(),
         instructionId: z.string().uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const writerRecord = await getWriterById(db, input.writerId);
      if (!writerRecord || writerRecord.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }
      await deleteWriterInstruction(db, input.writerId, input.instructionId);
   });

export const toggleInstruction = protectedProcedure
   .input(
      z.object({
         writerId: z.string().uuid(),
         instructionId: z.string().uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const writerRecord = await getWriterById(db, input.writerId);
      if (!writerRecord || writerRecord.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }
      return toggleWriterInstructionEnabled(
         db,
         input.writerId,
         input.instructionId,
      );
   });

// =============================================================================
// Photo Upload Procedures
// =============================================================================

export const generatePhotoUploadUrl = protectedProcedure
   .input(
      z.object({
         writerId: z.string().uuid(),
         fileExtension: z
            .string()
            .regex(/^[a-zA-Z0-9]{1,10}$/, "Invalid file extension"),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const writerRecord = await getWriterById(db, input.writerId);
      if (!writerRecord || writerRecord.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Writer not found" });
      }

      const bucketName = "writer-photos";
      try {
         const minioClient = getMinioClient(serverEnv);
         const fileName = `writer-${input.writerId}-${crypto.randomUUID()}.${input.fileExtension}`;

         const presignedUrl = await generatePresignedPutUrl(
            fileName,
            bucketName,
            minioClient,
            300,
         );

         return {
            presignedUrl,
            fileName,
            publicUrl: `/api/files/${bucketName}/${fileName}`,
         };
      } catch (error) {
         console.error("Failed to generate writer photo upload URL:", error);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to generate upload URL",
         });
      }
   });
