import { uploadFile } from "@packages/files/client";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const AgentFileUploadInput = z.object({
   agentId: z.string().uuid(),
   fileName: z.string(),
   fileBuffer: z.string(), // base64 encoded
   contentType: z.string(),
});

const AgentFileDeleteInput = z.object({
   agentId: z.string().uuid(),
   fileName: z.string(),
});

export const agentFileRouter = router({
   upload: protectedProcedure
      .input(AgentFileUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName, fileBuffer, contentType } = input;
         const key = `${agentId}/${fileName}`;
         const buffer = Buffer.from(fileBuffer, "base64");
         const bucketName = process.env.MINIO_BUCKET || "agent-files";
         const url = await uploadFile(
            key,
            buffer,
            contentType,
            bucketName,
            (await ctx).minioClient,
         );
         return { url };
      }),
   delete: protectedProcedure
      .input(AgentFileDeleteInput)
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName } = input;
         const key = `${agentId}/${fileName}`;
         const bucketName = process.env.MINIO_BUCKET || "agent-files";
         await (await ctx).minioClient.removeObject(bucketName, key);
         return { success: true };
      }),
});
