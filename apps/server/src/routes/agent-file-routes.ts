import { authMiddleware } from "@api/integrations/auth";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable, knowledgeChunk } from "../schemas/agent-schema";
import { NotFoundError } from "../shared/errors";
import { uploadFile } from "../integrations/minio";
import { distillQueue } from "../workers/distill-worker";
import { knowledgeChunkQueue } from "@api/workers/knowledge-chunk-worker";

export const agentFileRoutes = new Elysia()
   .use(authMiddleware)
   .post(
      "/:id/upload",
      async ({ params, body, user }) => {
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent)
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         const file = body.file;
         if (!file) throw new Error("No file provided");
         const fileBuffer = Buffer.from(await file.arrayBuffer());
         const fileUrl = await uploadFile(file.name, fileBuffer, file.type);
         const fileContent = fileBuffer.toString("utf-8");
         await distillQueue.add("distill-knowledge", {
            agentId: agent.id,
            rawText: fileContent,
            source: "brand_knowledge",
            sourceType: file.type,
            sourceIdentifier: fileUrl,
         });
         const uploadedFile = {
            fileName: file.name,
            fileUrl,
            uploadedAt: new Date().toISOString(),
         };
         const currentFiles = agent.uploadedFiles || [];
         const updatedFiles = [...currentFiles, uploadedFile];
         const updatedAgent = await db
            .update(agentTable)
            .set({ uploadedFiles: updatedFiles, updatedAt: new Date() })
            .where(eq(agentTable.id, params.id))
            .returning();
         return {
            success: true,
            file: uploadedFile,
            agent: updatedAgent[0],
            distillQueued: true,
         };
      },
      {
         auth: true,
         params: t.Object({ id: t.String() }),
         body: t.Object({ file: t.File() }),
      },
   )
   .delete(
      "/:id/files/:filename",
      async ({ params, user }) => {
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent)
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         const currentFiles = agent.uploadedFiles || [];
         const updatedFiles = currentFiles.filter(
            (file) => !file.fileUrl.includes(params.filename),
         );
         if (currentFiles.length === updatedFiles.length)
            throw new NotFoundError("File not found", "FILE_NOT_FOUND");
         const deletedFile = currentFiles.find((file) =>
            file.fileUrl.includes(params.filename),
         );
         if (deletedFile) {
            const chunks = await db.query.knowledgeChunk.findMany({
               where: eq(
                  knowledgeChunk.sourceIdentifier,
                  deletedFile.fileUrl.trim(),
               ),
               columns: { id: true, sourceIdentifier: true },
            });
            for (const chunk of chunks) {
               await knowledgeChunkQueue.add("delete", {
                  action: "delete",
                  chunkId: chunk.id,
               });
            }
         }
         const updatedAgent = await db
            .update(agentTable)
            .set({ uploadedFiles: updatedFiles, updatedAt: new Date() })
            .where(eq(agentTable.id, params.id))
            .returning();
         return { success: true, agent: updatedAgent[0] };
      },
      {
         auth: true,
         params: t.Object({ id: t.String(), filename: t.String() }),
      },
   );
