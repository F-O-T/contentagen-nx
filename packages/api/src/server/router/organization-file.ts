import { uploadFile } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { streamFileForProxy } from "@packages/files/client";
import {
   findOrganizationById,
   updateOrganization,
} from "@packages/database/repositories/auth-repository";

const OrganizationLogoUploadInput = z.object({
   fileName: z.string(),
   fileBuffer: z.base64(), // base64 encoded
   contentType: z.string(),
});

export const organizationFileRouter = router({
   uploadLogo: protectedProcedure
      .input(OrganizationLogoUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { fileName, fileBuffer } = input;
         const resolvedCtx = await ctx;

         // Get current organization info
         const organization = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         if (!organization?.id) {
            throw new Error("No active organization found");
         }

         const organizationId = organization.id;
         const db = resolvedCtx.db;

         // Get current organization from database to check for existing logo
         const currentOrganization = await findOrganizationById(
            db,
            organizationId,
         );

         // Delete old logo if it exists
         if (currentOrganization?.logo) {
            try {
               const bucketName = resolvedCtx.minioBucket;
               const minioClient = resolvedCtx.minioClient;
               await minioClient.removeObject(
                  bucketName,
                  currentOrganization.logo,
               );
            } catch (error) {
               console.error("Error deleting old organization logo:", error);
               // Continue with upload even if deletion fails
            }
         }

         const key = `organizations/${organizationId}/logo/${fileName}`;
         const buffer = Buffer.from(fileBuffer, "base64");

         // Compress the image
         const compressedBuffer = await compressImage(buffer, {
            format: "webp",
            quality: 80,
         });

         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;

         // Upload to S3/Minio
         const url = await uploadFile(
            key,
            compressedBuffer,
            "image/webp",
            bucketName,
            minioClient,
         );

         // Update organization logo directly in database
         try {
            await updateOrganization(db, organizationId, { logo: key });
         } catch (error) {
            console.error("Error updating organization logo:", error);
            // If database update fails, try to clean up uploaded file
            try {
               await minioClient.removeObject(bucketName, key);
            } catch (cleanupError) {
               console.error("Error cleaning up uploaded file:", cleanupError);
            }
            throw new Error("Failed to update organization logo");
         }

         return { url, key };
      }),

   getLogo: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });

      if (!organization?.logo) {
         return null;
      }

      const bucketName = resolvedCtx.minioBucket;
      const key = organization.logo;

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
         console.error("Error fetching organization logo:", error);
         return null;
      }
   }),
});
