import { listFiles, uploadFile } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";
import { z } from "zod";
import { protectedProcedure, router, organizationProcedure } from "../trpc";
import {
   updateBrand,
   getBrandById,
} from "@packages/database/repositories/brand-repository";
import { getFile, streamFileForProxy } from "@packages/files/client";
import { deleteAllBrandKnowledgeByExternalIdAndType } from "@packages/rag/repositories/brand-knowledge-repository";

const BrandFileDeleteInput = z.object({
   fileName: z.string(),
});

const BrandLogoUploadInput = z.object({
   brandId: z.uuid(),
   fileName: z.string(),
   fileBuffer: z.base64(), // base64 encoded
   contentType: z.string(),
});

export const brandFileRouter = router({
   uploadLogo: organizationProcedure
      .input(BrandLogoUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { brandId, fileName, fileBuffer } = input;

         // Get current brand to check for existing logo
         const db = (await ctx).db;
         const currentBrand = await getBrandById(db, brandId);

         // Delete old logo if it exists
         if (currentBrand?.logoUrl) {
            try {
               const bucketName = (await ctx).minioBucket;
               const minioClient = (await ctx).minioClient;
               await minioClient.removeObject(
                  bucketName,
                  currentBrand.logoUrl,
               );
            } catch (error) {
               console.error("Error deleting old logo:", error);
               // Continue with upload even if deletion fails
            }
         }

         const key = `${brandId}/logo/${fileName}`;
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
         // Update brand logoUrl
         await updateBrand(db, brandId, { logoUrl: key });
         return { url };
      }),

   getFileContent: protectedProcedure
      .input(z.object({ brandId: z.uuid(), fileName: z.string() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const key = `${input.brandId}/${input.fileName}`;
         const stream = await getFile(key, bucketName, minioClient);
         const chunks: Buffer[] = [];
         for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
         }
         const content = Buffer.concat(chunks).toString("utf-8");
         return { content };
      }),

   listBrandFiles: protectedProcedure
      .input(z.object({ brandId: z.uuid() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const prefix = `${input.brandId}/`;
         const files = await listFiles(bucketName, prefix, minioClient);
         return { files };
      }),

   delete: protectedProcedure
      .input(
         z.object({ brandId: z.uuid() }).and(BrandFileDeleteInput),
      )
      .mutation(async ({ ctx, input }) => {
         const { brandId, fileName } = input;
         const key = `${brandId}/${fileName}`;
         const bucketName = (await ctx).minioBucket;
         const resolvedCtx = await ctx;
         await deleteAllBrandKnowledgeByExternalIdAndType(
            resolvedCtx.ragClient,
            brandId,
            "document",
         );
         await deleteAllBrandKnowledgeByExternalIdAndType(
            resolvedCtx.ragClient,
            brandId,
            "feature",
         );

         await resolvedCtx.minioClient.removeObject(bucketName, key);
         const brand = await getBrandById(
            resolvedCtx.db,
            brandId,
         );
         const uploadedFiles = (
            Array.isArray(brand.uploadedFiles)
               ? brand.uploadedFiles
               : []
         ).filter((f) => f.fileName !== fileName);
         await updateBrand(resolvedCtx.db, brandId, {
            uploadedFiles,
         });
         return { success: true };
      }),

   deleteAllFiles: protectedProcedure
      .input(z.object({ brandId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { brandId } = input;
         const resolvedCtx = await ctx;

         // Get the brand to check current uploaded files
         const brand = await getBrandById(
            resolvedCtx.db,
            brandId,
         );
         const uploadedFiles = Array.isArray(brand.uploadedFiles)
            ? brand.uploadedFiles
            : [];

         if (uploadedFiles.length === 0) {
            return { success: true, message: "No files to delete" };
         }

         // Delete files from MinIO bucket
         const bucketName = resolvedCtx.minioBucket;
         const deletePromises = uploadedFiles.map(async (file) => {
            const key = `${brandId}/${file.fileName}`;
            try {
               await resolvedCtx.minioClient.removeObject(bucketName, key);
            } catch (error) {
               console.error(`Failed to delete file ${key}:`, error);
            }
         });

         await Promise.all(deletePromises);

         // Delete from ChromaDB collection
         try {
            await deleteAllBrandKnowledgeByExternalIdAndType(
               resolvedCtx.ragClient,
               brandId,
               "document",
            );
         } catch (error) {
            console.error("Failed to delete from ChromaDB:", error);
         }

         // Update brand's uploadedFiles to empty array
         await updateBrand(resolvedCtx.db, brandId, {
            uploadedFiles: [],
         });

         return {
            success: true,
            message: `Successfully deleted ${uploadedFiles.length} files`,
         };
      }),

   getLogo: protectedProcedure
      .input(z.object({ brandId: z.uuid() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const brand = await getBrandById(
            resolvedCtx.db,
            input.brandId,
         );
         if (!brand?.logoUrl) {
            return null;
         }

         const bucketName = resolvedCtx.minioBucket;
         const key = brand.logoUrl;

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