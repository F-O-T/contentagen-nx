import { uploadFile } from "@packages/files/client";
import { Type } from "@sinclair/typebox";
import { wrap } from "@typeschema/typebox";
import { protectedProcedure, router } from "../trpc";

const AgentFileUploadInput = Type.Object({
   agentId: Type.String({ format: "uuid" }),
   fileName: Type.String(),
   fileBuffer: Type.String({ contentEncoding: "base64" }), // base64 encoded
   contentType: Type.String(),
});

const AgentFileDeleteInput = Type.Object({
   agentId: Type.String({ format: "uuid" }),
   fileName: Type.String(),
});

export const agentFileRouter = router({
   upload: protectedProcedure
      .input(wrap(AgentFileUploadInput))
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
            ctx.minioClient,
         );
         return { url };
      }),
   delete: protectedProcedure
      .input(wrap(AgentFileDeleteInput))
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName } = input;
         const key = `${agentId}/${fileName}`;
         const bucketName = process.env.MINIO_BUCKET || "agent-files";
         await ctx.minioClient.removeObject(bucketName, key);
         return { success: true };
      }),
});
