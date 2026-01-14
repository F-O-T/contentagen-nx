import {
   addWriterInstruction,
   deleteWriterInstruction,
   getWriterInstructions,
   reorderWriterInstructions,
   toggleWriterInstructionEnabled,
   updateWriterInstruction,
} from "@packages/database/repositories/writer-instructions-repository";
import {
   createWriter,
   deleteWriter,
   getWriterById,
   getWritersByOrganizationId,
   updateWriter,
} from "@packages/database/repositories/writer-repository";
import {
   getContentCountsByWriterIds,
   getContentsByWriterId,
} from "@packages/database/repositories/content-repository";
import {
   CreateInstructionMemorySchema,
   PersonaConfigSchema,
   UpdateInstructionMemorySchema,
   WriterConfigSchema,
} from "@packages/database/schema";
import {
   deleteFile,
   generatePresignedGetUrl,
   generatePresignedPutUrl,
   verifyFileExists,
} from "@packages/files/client";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { Feature } from "@packages/stripe/features";
import { requireFeature } from "../middleware/feature-gate";
import { protectedProcedure, router } from "../trpc";

const ALLOWED_PHOTO_TYPES = [
   "image/jpeg",
   "image/png",
   "image/webp",
   "image/avif",
];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

// Helper to convert storage key to presigned URL
async function resolveProfilePhotoUrl(
   storageKey: string | null | undefined,
   bucketName: string,
   minioClient: Parameters<typeof generatePresignedGetUrl>[2],
): Promise<string | null> {
   if (!storageKey) return null;
   try {
      return await generatePresignedGetUrl(storageKey, bucketName, minioClient);
   } catch (error) {
      console.error("Error generating presigned URL for profile photo:", error);
      return null;
   }
}

export const writerRouter = router({
   create: protectedProcedure
      .input(
         z.object({
            personaConfig: PersonaConfigSchema,
            profilePhotoUrl: z.string().optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to create writers.",
               );
            }

            const created = await createWriter(resolvedCtx.db, {
               organizationId,
               personaConfig: input.personaConfig,
               profilePhotoUrl: input.profilePhotoUrl,
            });

            if (!created) {
               throw APIError.internal("Failed to create writer.");
            }

            return created;
         } catch (err) {
            console.error("Error creating writer:", err);
            propagateError(err);
            throw APIError.internal("Failed to create writer.");
         }
      }),

   delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to delete writers.",
               );
            }

            const existing = await getWriterById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Writer not found.");
            }
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to delete this writer.",
               );
            }

            await deleteWriter(resolvedCtx.db, input.id);
            return { success: true };
         } catch (err) {
            console.error("Error deleting writer:", err);
            propagateError(err);
            throw APIError.internal("Failed to delete writer.");
         }
      }),

   duplicate: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to duplicate writers.",
               );
            }

            const existing = await getWriterById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Writer not found.");
            }
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to duplicate this writer.",
               );
            }

            const duplicatedConfig = {
               ...existing.personaConfig,
               metadata: {
                  ...existing.personaConfig.metadata,
                  name: `${existing.personaConfig.metadata.name} (Copy)`,
               },
            };

            const created = await createWriter(resolvedCtx.db, {
               organizationId,
               personaConfig: duplicatedConfig,
               profilePhotoUrl: existing.profilePhotoUrl ?? undefined,
            });

            if (!created) {
               throw APIError.internal("Failed to duplicate writer.");
            }

            return created;
         } catch (err) {
            console.error("Error duplicating writer:", err);
            propagateError(err);
            throw APIError.internal("Failed to duplicate writer.");
         }
      }),

   getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to view writers.",
               );
            }

            const writer = await getWriterById(resolvedCtx.db, input.id);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }

            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this writer.",
               );
            }

            // Get content count for this writer
            const contents = await getContentsByWriterId(
               resolvedCtx.db,
               input.id,
            );
            const contentCount = contents.length;

            // Resolve profile photo URL
            const profilePhotoUrl = await resolveProfilePhotoUrl(
               writer.profilePhotoUrl,
               resolvedCtx.minioBucket,
               resolvedCtx.minioClient,
            );

            return {
               ...writer,
               profilePhotoUrl,
               contentCount,
            };
         } catch (err) {
            console.error("Error getting writer:", err);
            propagateError(err);
            throw APIError.internal("Failed to get writer.");
         }
      }),

   getStats: protectedProcedure.query(async ({ ctx }) => {
      try {
         const resolvedCtx = await ctx;
         const organizationId = resolvedCtx.organizationId;

         if (!organizationId) {
            throw APIError.unauthorized("Organization must be specified.");
         }

         const writers = await getWritersByOrganizationId(
            resolvedCtx.db,
            organizationId,
         );

         // Get content counts for all writers in a single batch query
         const writerIds = writers.map((writer) => writer.id);
         const contentCounts = await getContentCountsByWriterIds(
            resolvedCtx.db,
            writerIds,
         );

         const writersWithCounts = writers.map((writer) => ({
            writer,
            contentCount: contentCounts.get(writer.id) || 0,
         }));

         const totalWriters = writers.length;
         const totalContent = writersWithCounts.reduce(
            (sum, item) => sum + item.contentCount,
            0,
         );

         // Find the most active writer (most content)
         const mostActiveWriter =
            writersWithCounts.length > 0
               ? writersWithCounts.reduce((max, item) =>
                    item.contentCount > max.contentCount ? item : max,
                 )
               : null;

         // Resolve profile photo URL for most active writer
         const mostActiveWriterPhotoUrl = mostActiveWriter
            ? await resolveProfilePhotoUrl(
                 mostActiveWriter.writer.profilePhotoUrl,
                 resolvedCtx.minioBucket,
                 resolvedCtx.minioClient,
              )
            : null;

         return {
            mostActiveWriter: mostActiveWriter
               ? {
                    contentCount: mostActiveWriter.contentCount,
                    id: mostActiveWriter.writer.id,
                    name: mostActiveWriter.writer.personaConfig.metadata.name,
                    profilePhotoUrl: mostActiveWriterPhotoUrl,
                 }
               : null,
            totalWriters,
            totalContent,
         };
      } catch (err) {
         console.error("Error getting writer stats:", err);
         propagateError(err);
         throw APIError.internal("Failed to get writer stats.");
      }
   }),

   requestPhotoUploadUrl: protectedProcedure
      .input(
         z.object({
            writerId: z.string().uuid(),
            contentType: z
               .string()
               .refine((val) => ALLOWED_PHOTO_TYPES.includes(val), {
                  message: "File type must be JPEG, PNG, WebP, or AVIF",
               }),
            fileName: z.string(),
            fileSize: z
               .number()
               .max(MAX_PHOTO_SIZE, "File size must be less than 5MB"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify the writer exists and belongs to this organization
            const existing = await getWriterById(resolvedCtx.db, input.writerId);
            if (!existing) {
               throw APIError.notFound("Writer not found.");
            }
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this writer.",
               );
            }

            const timestamp = Date.now();
            const storageKey = `organizations/${organizationId}/writers/${input.writerId}/photo/${timestamp}-${input.fileName}`;

            const presignedUrl = await generatePresignedPutUrl(
               storageKey,
               resolvedCtx.minioBucket,
               resolvedCtx.minioClient,
               300, // 5 minutes
            );

            return {
               contentType: input.contentType,
               fileSize: input.fileSize,
               presignedUrl,
               storageKey,
            };
         } catch (err) {
            console.error("Error requesting photo upload URL:", err);
            propagateError(err);
            throw APIError.internal("Failed to request photo upload URL.");
         }
      }),

   cancelPhotoUpload: protectedProcedure
      .input(z.object({ storageKey: z.string() }))
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify the storage key belongs to this organization
            if (
               !input.storageKey.startsWith(`organizations/${organizationId}/`)
            ) {
               throw APIError.forbidden(
                  "Invalid storage key for this organization",
               );
            }

            await deleteFile(
               input.storageKey,
               resolvedCtx.minioBucket,
               resolvedCtx.minioClient,
            );

            return { success: true };
         } catch (err) {
            console.error("Error canceling photo upload:", err);
            propagateError(err);
            throw APIError.internal("Failed to cancel photo upload.");
         }
      }),

   confirmPhotoUpload: protectedProcedure
      .input(
         z.object({
            writerId: z.string().uuid(),
            storageKey: z.string(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify the storage key belongs to this organization
            if (
               !input.storageKey.startsWith(`organizations/${organizationId}/`)
            ) {
               throw APIError.forbidden(
                  "Invalid storage key for this organization",
               );
            }

            // Verify the writer exists and belongs to this organization
            const existing = await getWriterById(resolvedCtx.db, input.writerId);
            if (!existing) {
               throw APIError.notFound("Writer not found.");
            }
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this writer.",
               );
            }

            // Verify the file was uploaded
            const fileInfo = await verifyFileExists(
               input.storageKey,
               resolvedCtx.minioBucket,
               resolvedCtx.minioClient,
            );

            if (!fileInfo) {
               throw APIError.validation("File was not uploaded successfully");
            }

            // Delete old photo if it exists
            if (
               existing.profilePhotoUrl &&
               existing.profilePhotoUrl !== input.storageKey
            ) {
               try {
                  await deleteFile(
                     existing.profilePhotoUrl,
                     resolvedCtx.minioBucket,
                     resolvedCtx.minioClient,
                  );
               } catch (error) {
                  console.error("Error deleting old photo:", error);
               }
            }

            // Update writer with new photo
            const updated = await updateWriter(resolvedCtx.db, input.writerId, {
               profilePhotoUrl: input.storageKey,
            });

            return updated;
         } catch (err) {
            console.error("Error confirming photo upload:", err);
            propagateError(err);
            throw APIError.internal("Failed to confirm photo upload.");
         }
      }),

   list: protectedProcedure
      .input(
         z.object({
            limit: z.number().min(1).max(100).optional().default(20),
            page: z.number().min(1).optional().default(1),
            search: z.string().optional(),
         }),
      )
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            const writers = await getWritersByOrganizationId(
               resolvedCtx.db,
               organizationId,
            );

            // Filter by search if provided
            let filteredWriters = writers;
            if (input.search) {
               const searchLower = input.search.toLowerCase();
               filteredWriters = writers.filter(
                  (writer) =>
                     writer.personaConfig.metadata.name
                        .toLowerCase()
                        .includes(searchLower) ||
                     writer.personaConfig.metadata.description
                        ?.toLowerCase()
                        .includes(searchLower),
               );
            }

            // Paginate
            const total = filteredWriters.length;
            const totalPages = Math.ceil(total / input.limit);
            const start = (input.page - 1) * input.limit;
            const end = start + input.limit;
            const paginatedWriters = filteredWriters.slice(start, end);

            // Get content counts for paginated writers in a single batch query
            const paginatedIds = paginatedWriters.map((writer) => writer.id);
            const contentCounts = await getContentCountsByWriterIds(
               resolvedCtx.db,
               paginatedIds,
            );

            // Resolve profile photo URLs for all paginated writers
            const writersWithCounts = await Promise.all(
               paginatedWriters.map(async (writer) => ({
                  ...writer,
                  profilePhotoUrl: await resolveProfilePhotoUrl(
                     writer.profilePhotoUrl,
                     resolvedCtx.minioBucket,
                     resolvedCtx.minioClient,
                  ),
                  contentCount: contentCounts.get(writer.id) || 0,
               })),
            );

            return {
               items: writersWithCounts,
               limit: input.limit,
               page: input.page,
               total,
               totalPages,
            };
         } catch (err) {
            console.error("Error listing writers:", err);
            propagateError(err);
            throw APIError.internal("Failed to list writers.");
         }
      }),

   update: protectedProcedure
      .input(
         z.object({
            data: z.object({
               personaConfig: PersonaConfigSchema.optional(),
               profilePhotoUrl: z.string().optional().nullable(),
            }),
            id: z.string().uuid(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to update writers.",
               );
            }

            const existing = await getWriterById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Writer not found.");
            }
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this writer.",
               );
            }

            const updateData: Parameters<typeof updateWriter>[2] = {};
            if (input.data.personaConfig) {
               updateData.personaConfig = input.data.personaConfig;
            }
            if (input.data.profilePhotoUrl !== undefined) {
               updateData.profilePhotoUrl =
                  input.data.profilePhotoUrl ?? undefined;
            }

            const updated = await updateWriter(
               resolvedCtx.db,
               input.id,
               updateData,
            );
            return updated;
         } catch (err) {
            console.error("Error updating writer:", err);
            propagateError(err);
            throw APIError.internal("Failed to update writer.");
         }
      }),

   getWriterConfig: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to view writer config.",
               );
            }

            const writer = await getWriterById(resolvedCtx.db, input.id);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }
            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this writer's config.",
               );
            }

            // Return the writer config (instructions field in personaConfig)
            return writer.personaConfig.instructions ?? {};
         } catch (err) {
            console.error("Error getting writer config:", err);
            propagateError(err);
            throw APIError.internal("Failed to get writer config.");
         }
      }),

   updateWriterConfig: protectedProcedure
      .input(
         z.object({
            id: z.string().uuid(),
            config: WriterConfigSchema.partial(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized(
                  "User must be authenticated and belong to an organization to update writer config.",
               );
            }

            const existing = await getWriterById(resolvedCtx.db, input.id);
            if (!existing) {
               throw APIError.notFound("Writer not found.");
            }
            if (existing.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this writer's config.",
               );
            }

            // Merge new config with existing config and parse to apply defaults
            const currentConfig = existing.personaConfig.instructions ?? {};
            const mergedConfig = WriterConfigSchema.parse({
               ...currentConfig,
               ...input.config,
            });

            // Update the personaConfig with merged instructions
            const updatedPersonaConfig = {
               ...existing.personaConfig,
               instructions: mergedConfig,
            };

            const updated = await updateWriter(resolvedCtx.db, input.id, {
               personaConfig: updatedPersonaConfig,
            });

            return updated?.personaConfig.instructions ?? {};
         } catch (err) {
            console.error("Error updating writer config:", err);
            propagateError(err);
            throw APIError.internal("Failed to update writer config.");
         }
      }),

   // ===== INSTRUCTION MEMORIES =====

   /**
    * List all instruction memories for a writer.
    */
   listInstructions: protectedProcedure
      .use(requireFeature(Feature.AGENT_INSTRUCTIONS))
      .input(z.object({ writerId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify writer belongs to organization
            const writer = await getWriterById(resolvedCtx.db, input.writerId);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }
            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to view this writer's instructions.",
               );
            }

            const instructions = await getWriterInstructions(
               resolvedCtx.db,
               input.writerId,
            );

            return instructions;
         } catch (err) {
            console.error("Error listing writer instructions:", err);
            propagateError(err);
            throw APIError.internal("Failed to list writer instructions.");
         }
      }),

   /**
    * Create a new instruction memory for a writer.
    */
   createInstruction: protectedProcedure
      .use(requireFeature(Feature.AGENT_INSTRUCTIONS))
      .input(
         z.object({
            writerId: z.string().uuid(),
            data: CreateInstructionMemorySchema,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify writer belongs to organization
            const writer = await getWriterById(resolvedCtx.db, input.writerId);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }
            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to add instructions to this writer.",
               );
            }

            const instruction = await addWriterInstruction(
               resolvedCtx.db,
               input.writerId,
               input.data,
            );

            return instruction;
         } catch (err) {
            console.error("Error creating writer instruction:", err);
            propagateError(err);
            throw APIError.internal("Failed to create writer instruction.");
         }
      }),

   /**
    * Update an existing instruction memory.
    */
   updateInstruction: protectedProcedure
      .use(requireFeature(Feature.AGENT_INSTRUCTIONS))
      .input(
         z.object({
            writerId: z.string().uuid(),
            instructionId: z.string().uuid(),
            data: UpdateInstructionMemorySchema,
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify writer belongs to organization
            const writer = await getWriterById(resolvedCtx.db, input.writerId);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }
            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to update this writer's instructions.",
               );
            }

            const instruction = await updateWriterInstruction(
               resolvedCtx.db,
               input.writerId,
               input.instructionId,
               input.data,
            );

            return instruction;
         } catch (err) {
            console.error("Error updating writer instruction:", err);
            propagateError(err);
            throw APIError.internal("Failed to update writer instruction.");
         }
      }),

   /**
    * Delete an instruction memory.
    */
   deleteInstruction: protectedProcedure
      .use(requireFeature(Feature.AGENT_INSTRUCTIONS))
      .input(
         z.object({
            writerId: z.string().uuid(),
            instructionId: z.string().uuid(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify writer belongs to organization
            const writer = await getWriterById(resolvedCtx.db, input.writerId);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }
            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to delete this writer's instructions.",
               );
            }

            await deleteWriterInstruction(
               resolvedCtx.db,
               input.writerId,
               input.instructionId,
            );

            return { success: true };
         } catch (err) {
            console.error("Error deleting writer instruction:", err);
            propagateError(err);
            throw APIError.internal("Failed to delete writer instruction.");
         }
      }),

   /**
    * Reorder instruction memories.
    */
   reorderInstructions: protectedProcedure
      .use(requireFeature(Feature.AGENT_INSTRUCTIONS))
      .input(
         z.object({
            writerId: z.string().uuid(),
            orderedIds: z.array(z.string().uuid()),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify writer belongs to organization
            const writer = await getWriterById(resolvedCtx.db, input.writerId);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }
            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to reorder this writer's instructions.",
               );
            }

            const instructions = await reorderWriterInstructions(
               resolvedCtx.db,
               input.writerId,
               input.orderedIds,
            );

            return instructions;
         } catch (err) {
            console.error("Error reordering writer instructions:", err);
            propagateError(err);
            throw APIError.internal("Failed to reorder writer instructions.");
         }
      }),

   /**
    * Toggle the enabled status of an instruction memory.
    */
   toggleInstructionEnabled: protectedProcedure
      .use(requireFeature(Feature.AGENT_INSTRUCTIONS))
      .input(
         z.object({
            writerId: z.string().uuid(),
            instructionId: z.string().uuid(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         try {
            const resolvedCtx = await ctx;
            const organizationId = resolvedCtx.organizationId;

            if (!organizationId) {
               throw APIError.unauthorized("Organization must be specified.");
            }

            // Verify writer belongs to organization
            const writer = await getWriterById(resolvedCtx.db, input.writerId);
            if (!writer) {
               throw APIError.notFound("Writer not found.");
            }
            if (writer.organizationId !== organizationId) {
               throw APIError.forbidden(
                  "You don't have permission to toggle this writer's instructions.",
               );
            }

            const instruction = await toggleWriterInstructionEnabled(
               resolvedCtx.db,
               input.writerId,
               input.instructionId,
            );

            return instruction;
         } catch (err) {
            console.error("Error toggling writer instruction:", err);
            propagateError(err);
            throw APIError.internal("Failed to toggle writer instruction.");
         }
      }),
});
