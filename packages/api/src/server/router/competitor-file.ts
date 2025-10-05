import { listFiles, uploadFile } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";
import { z } from "zod";
import { protectedProcedure, router, organizationProcedure } from "../trpc";
import {
   updateCompetitor,
   getCompetitorById,
} from "@packages/database/repositories/competitor-repository";
import { getFile, streamFileForProxy } from "@packages/files/client";
import { deleteAllCompetitorKnowledgeByExternalIdAndType } from "@packages/rag/repositories/competitor-knowledge-repository";

const CompetitorFileDeleteInput = z.object({
   fileName: z.string(),
});

const CompetitorLogoUploadInput = z.object({
   competitorId: z.uuid(),
   fileName: z.string(),
   fileBuffer: z.base64(), // base64 encoded
   contentType: z.string(),
});

export const competitorFileRouter = router({
   uploadLogo: organizationProcedure
      .input(CompetitorLogoUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { competitorId, fileName, fileBuffer } = input;

         // Get current competitor to check for existing logo
         const db = (await ctx).db;
         const currentCompetitor = await getCompetitorById(db, competitorId);

         // Delete old logo if it exists
         if (currentCompetitor?.logoPhoto) {
            try {
               const bucketName = (await ctx).minioBucket;
               const minioClient = (await ctx).minioClient;
               await minioClient.removeObject(
                  bucketName,
                  currentCompetitor.logoPhoto,
               );
            } catch (error) {
               console.error("Error deleting old logo:", error);
               // Continue with upload even if deletion fails
            }
         }

         const key = `${competitorId}/logo/${fileName}`;
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
         // Update competitor logoPath
         await updateCompetitor(db, competitorId, { logoPhoto: key });
         return { url };
      }),

   getFileContent: protectedProcedure
      .input(z.object({ competitorId: z.uuid(), fileName: z.string() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const key = `${input.competitorId}/${input.fileName}`;
         const stream = await getFile(key, bucketName, minioClient);
         const chunks: Buffer[] = [];
         for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
         }
         const content = Buffer.concat(chunks).toString("utf-8");
         return { content };
      }),

   listCompetitorFiles: protectedProcedure
      .input(z.object({ competitorId: z.uuid() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const prefix = `${input.competitorId}/`;
         const files = await listFiles(bucketName, prefix, minioClient);
         return { files };
      }),

   delete: protectedProcedure
      .input(
         z.object({ competitorId: z.uuid() }).and(CompetitorFileDeleteInput),
      )
      .mutation(async ({ ctx, input }) => {
         const { competitorId, fileName } = input;
         const key = `${competitorId}/${fileName}`;
         const bucketName = (await ctx).minioBucket;
         const resolvedCtx = await ctx;
         await deleteAllCompetitorKnowledgeByExternalIdAndType(
            resolvedCtx.ragClient,
            competitorId,
            "document",
         );
         await deleteAllCompetitorKnowledgeByExternalIdAndType(
            resolvedCtx.ragClient,
            competitorId,
            "feature",
         );

         await resolvedCtx.minioClient.removeObject(bucketName, key);
         const competitor = await getCompetitorById(
            resolvedCtx.db,
            competitorId,
         );
         const uploadedFiles = (
            Array.isArray(competitor.uploadedFiles)
               ? competitor.uploadedFiles
               : []
         ).filter((f) => f.fileName !== fileName);
         await updateCompetitor(resolvedCtx.db, competitorId, {
            uploadedFiles,
         });
         return { success: true };
      }),

   deleteAllFiles: protectedProcedure
      .input(z.object({ competitorId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { competitorId } = input;
         const resolvedCtx = await ctx;

         // Get the competitor to check current uploaded files
         const competitor = await getCompetitorById(
            resolvedCtx.db,
            competitorId,
         );
         const uploadedFiles = Array.isArray(competitor.uploadedFiles)
            ? competitor.uploadedFiles
            : [];

         if (uploadedFiles.length === 0) {
            return { success: true, message: "No files to delete" };
         }

         // Delete files from MinIO bucket
         const bucketName = resolvedCtx.minioBucket;
         const deletePromises = uploadedFiles.map(async (file) => {
            const key = `${competitorId}/${file.fileName}`;
            try {
               await resolvedCtx.minioClient.removeObject(bucketName, key);
            } catch (error) {
               console.error(`Failed to delete file ${key}:`, error);
            }
         });

         await Promise.all(deletePromises);

         // Delete from ChromaDB collection
         try {
            await deleteAllCompetitorKnowledgeByExternalIdAndType(
               resolvedCtx.ragClient,
               competitorId,
               "document",
            );
         } catch (error) {
            console.error("Failed to delete from ChromaDB:", error);
         }

         // Update competitor's uploadedFiles to empty array
         await updateCompetitor(resolvedCtx.db, competitorId, {
            uploadedFiles: [],
         });

         return {
            success: true,
            message: `Successfully deleted ${uploadedFiles.length} files`,
         };
      }),

   getLogo: protectedProcedure
      .input(z.object({ competitorId: z.uuid() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const competitor = await getCompetitorById(
            resolvedCtx.db,
            input.competitorId,
         );
         if (!competitor?.logoPhoto) {
            return null;
         }

         const bucketName = resolvedCtx.minioBucket;
         const key = competitor.logoPhoto;

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
            console.error("Error fetching logo:", error);
            return null;
         }
      }),
});
