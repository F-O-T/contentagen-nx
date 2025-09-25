import { uploadFile } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";
import { z } from "zod";
import { protectedProcedure, router, organizationProcedure } from "../trpc";
import {
   updateAgent,
   getAgentById,
} from "@packages/database/repositories/agent-repository";
import { streamFileForProxy } from "@packages/files/client";

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

         // Get current agent to check for existing profile photo
         const db = (await ctx).db;
         const currentAgent = await getAgentById(db, agentId);

         // Delete old profile photo if it exists
         if (currentAgent?.profilePhotoUrl) {
            try {
               const bucketName = (await ctx).minioBucket;
               const minioClient = (await ctx).minioClient;
               await minioClient.removeObject(
                  bucketName,
                  currentAgent.profilePhotoUrl,
               );
            } catch (error) {
               console.error("Error deleting old profile photo:", error);
               // Continue with upload even if deletion fails
            }
         }

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
         await updateAgent(db, agentId, { profilePhotoUrl: key });
         return { url };
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
