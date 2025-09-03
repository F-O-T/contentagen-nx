import { listFiles, uploadFile } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";
import { z } from "zod";
import { protectedProcedure, router, organizationProcedure } from "../trpc";
import {
   updateAgent,
   getAgentById,
} from "@packages/database/repositories/agent-repository";
import { getFile, streamFileForProxy } from "@packages/files/client";
import {
   deleteFromCollection,
   getCollection,
} from "@packages/chroma-db/helpers";
import { AgentInsertSchema } from "@packages/database/schema";
import { enqueueAutoBrandKnowledgeJob } from "@packages/workers/queues/knowledge/brand-knowledge-crawl";

const AgentFileDeleteInput = z.object({
   fileName: z.string(),
});

const AgentProfilePhotoUploadInput = z.object({
   agentId: z.uuid(),
   fileName: z.string(),
   fileBuffer: z.base64(), // base64 encoded
   contentType: z.string(),
});

export const agentFileRouter = router({
   uploadProfilePhoto: organizationProcedure
      .input(AgentProfilePhotoUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName, fileBuffer } = input;
         const key = `${agentId}/profile-photo/${fileName}`;
         const buffer = Buffer.from(fileBuffer, "base64");

         // Compress the image
         const compressedBuffer = await compressImage(buffer, {
            format: "webp",
            quality: 80,
         });

         const bucketName = (await ctx).minioBucket;
         const minioClient = (await ctx).minioClient;
         // Upload to S3/Minio
         const url = await uploadFile(
            key,
            compressedBuffer,
            "image/webp",
            bucketName,
            minioClient,
         );
         // Update agent profilePhotoUrl
         const db = (await ctx).db;
         await updateAgent(db, agentId, { profilePhotoUrl: key });
         return { url };
      }),
   generateBrandKnowledge: organizationProcedure
      .input(
         AgentInsertSchema.pick({ id: true }).extend({
            websiteUrl: z.url(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user.id;
         if (!userId) {
            throw new Error("User not authenticated");
         }
         if (!input.id) {
            throw new Error(
               "Missing required fields: id, userId, or websiteUrl",
            );
         }
         await enqueueAutoBrandKnowledgeJob({
            agentId: input.id,
            userId: userId,
            websiteUrl: input.websiteUrl,
         });
         return { success: true };
      }),
   getFileContent: protectedProcedure
      .input(z.object({ agentId: z.uuid(), fileName: z.string() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const key = `${input.agentId}/${input.fileName}`;
         const stream = await getFile(key, bucketName, minioClient);
         const chunks: Buffer[] = [];
         for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
         }
         const content = Buffer.concat(chunks).toString("utf-8");
         return { content };
      }),
   listAgentFiles: protectedProcedure
      .input(z.object({ agentId: z.uuid() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const prefix = `${input.agentId}/`;
         const files = await listFiles(bucketName, prefix, minioClient);
         return { files };
      }),

   delete: protectedProcedure
      .input(z.object({ agentId: z.uuid() }).and(AgentFileDeleteInput))
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName } = input;
         const key = `${agentId}/${fileName}`;
         const bucketName = (await ctx).minioBucket;
         const resolvedCtx = await ctx;
         const collection = await getCollection(
            resolvedCtx.chromaClient,
            "AgentKnowledge",
         );
         await deleteFromCollection(collection, {
            where: {
               sourceId: key,
            },
         });
         await resolvedCtx.minioClient.removeObject(bucketName, key);
         const agent = await getAgentById(resolvedCtx.db, agentId);
         const uploadedFiles = (
            Array.isArray(agent.uploadedFiles) ? agent.uploadedFiles : []
         ).filter((f) => f.fileName !== fileName);
         await updateAgent(resolvedCtx.db, agentId, { uploadedFiles });
         return { success: true };
      }),
   deleteAllFiles: protectedProcedure
      .input(z.object({ agentId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { agentId } = input;
         const resolvedCtx = await ctx;

         // Get the agent to check current uploaded files
         const agent = await getAgentById(resolvedCtx.db, agentId);
         const uploadedFiles = Array.isArray(agent.uploadedFiles)
            ? agent.uploadedFiles
            : [];

         if (uploadedFiles.length === 0) {
            return { success: true, message: "No files to delete" };
         }

         // Delete files from MinIO bucket
         const bucketName = resolvedCtx.minioBucket;
         const deletePromises = uploadedFiles.map(async (file) => {
            const key = `${agentId}/${file.fileName}`;
            try {
               await resolvedCtx.minioClient.removeObject(bucketName, key);
            } catch (error) {
               console.error(`Failed to delete file ${key}:`, error);
            }
         });

         await Promise.all(deletePromises);

         // Delete from ChromaDB collection
         try {
            const collection = await getCollection(
               resolvedCtx.chromaClient,
               "AgentKnowledge",
            );

            const sourceIds = uploadedFiles.map(
               (file) => `${agentId}/${file.fileName}`,
            );
            await deleteFromCollection(collection, {
               where: {
                  sourceId: { $in: sourceIds },
               },
            });
         } catch (error) {
            console.error("Failed to delete from ChromaDB:", error);
         }

         // Update agent's uploadedFiles to empty array
         await updateAgent(resolvedCtx.db, agentId, {
            uploadedFiles: [],
            brandKnowledgeStatus: "pending",
         });

         return {
            success: true,
            message: `Successfully deleted ${uploadedFiles.length} files`,
         };
      }),
   getProfilePhoto: protectedProcedure
      .input(z.object({ agentId: z.uuid() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const agent = await getAgentById(resolvedCtx.db, input.agentId);
         if (!agent?.profilePhotoUrl) {
            return null;
         }

         const bucketName = resolvedCtx.minioBucket;
         const key = agent.profilePhotoUrl;

         try {
            const { buffer, contentType } = await streamFileForProxy(
               key,
               bucketName,
               resolvedCtx.minioClient,
            );
            const base64 = buffer.toString("base64");
            return {
               data: `data:${contentType};base64,${base64}`,
               contentType,
            };
         } catch (error) {
            console.error("Error fetching profile photo:", error);
            return null;
         }
      }),
});
