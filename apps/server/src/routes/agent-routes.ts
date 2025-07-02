import { authMiddleware } from "@api/integrations/auth";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable } from "../schemas/agent-schema";
import { NotFoundError } from "../shared/errors";
import { uploadFile } from "../integrations/minio";
import { distillQueue } from "../workers/distill-worker";
import { generateDefaultBasePrompt } from "../services/agent-prompt";

const _createAgent = createInsertSchema(agentTable);

export const agentRoutes = new Elysia({
   prefix: "/agents",
})
   .use(authMiddleware)
   .post(
      "/",
      async ({ body, user }) => {
         // Generate default base prompt for the agent
         const agentConfig = {
            ...body,
            description: body.description ?? null,
            formattingStyle: body.formattingStyle ?? "structured",
            isActive: body.isActive ?? true,
            totalDrafts: body.totalDrafts ?? 0,
            totalPublished: body.totalPublished ?? 0,
            lastGeneratedAt: body.lastGeneratedAt ?? null,
            // Add required fields that will be set by the database
            id: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
            basePrompt: null,
            uploadedFiles: [],
         };
         const basePrompt = generateDefaultBasePrompt(agentConfig);

         const agent = await db
            .insert(agentTable)
            .values({
               ...body,
               basePrompt,
               userId: user.id,
            })
            .returning();
         return { agent };
      },
      {
         auth: true,
         body: t.Omit(_createAgent, [
            "id",
            "createdAt",
            "updatedAt",
            "userId",
            "basePrompt",
         ]),
      },
   )
   .patch(
      "/:id",
      async ({ params, body, user }) => {
         const updated = await db
            .update(agentTable)
            .set(body)
            .where(
               and(
                  eq(agentTable.id, params.id),
                  eq(agentTable.userId, user.id),
               ),
            )
            .returning();
         if (!updated.length) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }
         return { agent: updated[0] };
      },
      {
         auth: true,
         body: t.Partial(
            t.Omit(_createAgent, ["id", "createdAt", "updatedAt", "userId"]),
         ),
         params: t.Object({ id: t.String() }),
      },
   )
   .get(
      "/",
      async ({ user }) => {
         const agents = await db.query.agent.findMany({
            where: eq(agentTable.userId, user.id),
         });
         return { agents };
      },
      {
         auth: true,
      },
   )
   .get(
      "/:id",
      async ({ params, user }) => {
         let agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }

         // Generate base prompt if it doesn't exist
         if (!agent.basePrompt) {
            const basePrompt = generateDefaultBasePrompt({
               ...agent,
               description: agent.description ?? null,
               formattingStyle: agent.formattingStyle ?? "structured",
            });

            // Update the agent with the generated base prompt
            await db
               .update(agentTable)
               .set({ basePrompt })
               .where(eq(agentTable.id, params.id))
               .returning();

            agent = { ...agent, basePrompt };
         }

         return { agent };
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
         }),
      },
   )
   .delete(
      "/:id",
      async ({ params, user }) => {
         const deleted = await db
            .delete(agentTable)
            .where(
               and(
                  eq(agentTable.id, params.id),
                  eq(agentTable.userId, user.id),
               ),
            )
            .returning();
         if (!deleted.length) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }
         return new Response(null, { status: 204 });
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
         }),
      },
   )
   .post(
      "/:id/upload",
      async ({ params, body, user }) => {
         // First, verify the agent exists and belongs to the user
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });

         if (!agent) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }

         // Handle file upload
         const file = body.file;
         if (!file) {
            throw new Error("No file provided");
         }

         // Upload file to MinIO
         const fileBuffer = Buffer.from(await file.arrayBuffer());
         const fileUrl = await uploadFile(file.name, fileBuffer, file.type);

         // Read file content for distillation
         const fileContent = fileBuffer.toString("utf-8");

         // Enqueue distillation job
         await distillQueue.add("distill-knowledge", {
            agentId: agent.id,
            rawText: fileContent,
            source: file.name,
            sourceType: file.type,
            sourceIdentifier: fileUrl,
         });

         // Update agent with new file
         const uploadedFile = {
            fileName: file.name,
            fileUrl,
            uploadedAt: new Date().toISOString(),
         };

         const currentFiles = agent.uploadedFiles || [];
         const updatedFiles = [...currentFiles, uploadedFile];

         // Only update uploadedFiles, do not update knowledgeBase
         const updatedAgent = await db
            .update(agentTable)
            .set({
               uploadedFiles: updatedFiles,
               updatedAt: new Date(),
            })
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
         params: t.Object({
            id: t.String(),
         }),
         body: t.Object({
            file: t.File(),
         }),
      },
   )
   .delete(
      "/:id/files/:filename",
      async ({ params, user }) => {
         // First, verify the agent exists and belongs to the user
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });

         if (!agent) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }

         // Find and remove the file from uploadedFiles array
         const currentFiles = agent.uploadedFiles || [];
         const updatedFiles = currentFiles.filter(
            (file) => !file.fileUrl.includes(params.filename),
         );

         if (currentFiles.length === updatedFiles.length) {
            throw new NotFoundError("File not found", "FILE_NOT_FOUND");
         }

         // No knowledgeBase update, just update uploadedFiles
         const updatedAgent = await db
            .update(agentTable)
            .set({
               uploadedFiles: updatedFiles,
               updatedAt: new Date(),
            })
            .where(eq(agentTable.id, params.id))
            .returning();

         return {
            success: true,
            agent: updatedAgent[0],
         };
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
            filename: t.String(),
         }),
      },
   );
