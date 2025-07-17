import { publicProcedure, router } from "../trpc";
import { Type } from "@sinclair/typebox";
import { wrap } from "@typeschema/typebox";
import { uploadFile } from "@packages/files/client";

const AgentFileUploadInput = Type.Object({
   agentId: Type.String({ format: "uuid" }),
   fileName: Type.String(),
   fileBuffer: Type.String({ contentEncoding: "base64" }), // base64 encoded
   contentType: Type.String(),
});

export const agentFileRouter = router({
   upload: publicProcedure
      .input(wrap(AgentFileUploadInput))
      .mutation(async ({ ctx, input }) => {
         const { agentId, fileName, fileBuffer, contentType } = input;
         const key = `${agentId}/${fileName}`;
         const buffer = Buffer.from(fileBuffer, "base64");
         const url = await uploadFile(
            key,
            buffer,
            contentType,
            ctx.minioBucket,
            ctx.minioClient,
         );
         return { url };
      }),
});
