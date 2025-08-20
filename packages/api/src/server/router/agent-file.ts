import { listFiles, uploadFile } from "@packages/files/client";
import { autoBrandKnowledgeQueue } from "@packages/workers/queues/auto-brand-knowledge";
import { enqueueKnowledgeDistillationJob } from "@packages/workers/queues/knowledge-distillation";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
   updateAgent,
   getAgentById,
} from "@packages/database/repositories/agent-repository";
import { getFile } from "@packages/files/client";
import {
   deleteFromCollection,
   ensureAgentKnowledgeCollection,
} from "@packages/chroma-db/helpers";
import { AgentInsertSchema } from "@packages/database/schema";

const AgentFileUploadInput = z.object({
   fileName: z.string(),
   fileBuffer: z.base64(), // base64 encoded
   contentType: z.string(),
});

const AgentFileDeleteInput = z.object({
   fileName: z.string(),
});

export const agentFileRouter = router({
   generateBrandKnowledge: protectedProcedure
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
         await autoBrandKnowledgeQueue.add("auto-brand-knowledge-workflow", {
            agentId: input.id,
            userId: userId,
            websiteUrl: input.websiteUrl,
         });
         return { success: true };
      }),
   getFileContent: protectedProcedure
      .input(z.object({ agentId: z.string().uuid(), fileName: z.string() }))
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
      .input(z.object({ agentId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const prefix = `${input.agentId}/`;
         const files = await listFiles(bucketName, prefix, minioClient);
         return { files };
      }),

   upload: protectedProcedure
      .input(z.object({ agentId: z.string().uuid() }).and(AgentFileUploadInput))
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName, fileBuffer, contentType } = input;
         const key = `${agentId}/${fileName}`;
         const buffer = Buffer.from(fileBuffer, "base64");
         const bucketName = (await ctx).minioBucket;
         const url = await uploadFile(
            key,
            buffer,
            contentType,
            bucketName,
            (await ctx).minioClient,
         );
         // Update agent's uploadedFiles in DB
         const db = (await ctx).db;
         const agent = await getAgentById(db, agentId);
         const now = new Date().toISOString();
         const uploadedFiles = Array.isArray(agent.uploadedFiles)
            ? agent.uploadedFiles
            : [];
         uploadedFiles.push({ fileName, fileUrl: key, uploadedAt: now });
         await updateAgent(db, agentId, { uploadedFiles });

         // --- Knowledge Distillation Integration ---
         try {
            // Read file content as text
            const fileContent = buffer.toString("utf-8");
            await enqueueKnowledgeDistillationJob({
               inputText: fileContent,
               agentId,
               sourceId: key,
               userId: ctx.session.user.id,
            });
         } catch (err) {
            // Log error but do not block upload
            console.error("Knowledge distillation failed:", err);
         }

         return { url };
      }),
   delete: protectedProcedure
      .input(z.object({ agentId: z.string().uuid() }).and(AgentFileDeleteInput))
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName } = input;
         const key = `${agentId}/${fileName}`;
         const bucketName = (await ctx).minioBucket;
         const resolvedCtx = await ctx;
         const chromaCollection = await ensureAgentKnowledgeCollection(
            resolvedCtx.chromaClient,
         );
         await deleteFromCollection(chromaCollection, {
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
});
