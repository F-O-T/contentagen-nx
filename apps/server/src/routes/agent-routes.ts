import { authMiddleware } from "@api/integrations/auth";
import { and, eq, desc } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable, knowledgeChunk } from "../schemas/agent-schema";
import { contentRequest } from "../schemas/content-schema";
import { NotFoundError } from "../shared/errors";
import { uploadFile } from "../integrations/minio";
import { distillQueue } from "../workers/distill-worker";
import { generateDefaultBasePrompt } from "../services/agent-prompt";
import { knowledgeChunkQueue } from "@api/workers/knowledge-chunk-worker";
import { handleAgentSlots } from "@api/modules/billing/billing-service";

const _createAgent = createInsertSchema(agentTable);

export const agentRoutes = new Elysia({
   prefix: "/agents",
})
   .use(authMiddleware)
   .post(
      "/",
      async ({ body, set, user, request }) => {
         const agentConfig: typeof agentTable.$inferSelect = {
            ...body,
            description: body.description ?? null,
            formattingStyle: body.formattingStyle ?? "structured",
            isActive: body.isActive ?? true,
            totalDrafts: body.totalDrafts ?? 0,
            totalPublished: body.totalPublished ?? 0,
            lastGeneratedAt: body.lastGeneratedAt ?? null,
            communicationStyle: body.communicationStyle ?? "first_person",
            brandIntegration: body.brandIntegration ?? "strict_guideline",
            // Add required fields that will be set by the database
            id: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
            basePrompt: null,
            uploadedFiles: [],
         };
         const basePrompt = generateDefaultBasePrompt(agentConfig);
         try {
            await handleAgentSlots(request.headers);
         } catch (error) {
            console.error("Error handling agent slots:", error);
            set.status = 402;
            return "Agent slots limit reached. Please upgrade your plan.";
         }
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
         // Fetch the agent to ensure it exists and belongs to the user
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }
         // Always regenerate the basePrompt with the latest config
         const updatedAgentConfig = {
            ...agent,
            ...body,
            description: body.description ?? agent.description ?? "",
            formattingStyle:
               body.formattingStyle ?? agent.formattingStyle ?? "structured",
            contentType: body.contentType ?? agent.contentType ?? "blog_posts",
            name: body.name ?? agent.name ?? "Agent",
            createdAt: agent.createdAt ?? new Date(),
            targetAudience:
               body.targetAudience ?? agent.targetAudience ?? "general_public",
            voiceTone: body.voiceTone ?? agent.voiceTone ?? "professional",
            language: body.language ?? agent.language ?? "english",
            brandIntegration:
               body.brandIntegration ??
               agent.brandIntegration ??
               "strict_guideline",
            communicationStyle:
               body.communicationStyle ??
               agent.communicationStyle ??
               "first_person",
            isActive: body.isActive ?? agent.isActive ?? true,
            totalDrafts: body.totalDrafts ?? agent.totalDrafts ?? 0,
            totalPublished: body.totalPublished ?? agent.totalPublished ?? 0,
            lastGeneratedAt:
               body.lastGeneratedAt ?? agent.lastGeneratedAt ?? null,
            updatedAt: new Date(),
            userId: agent.userId,
            uploadedFiles: body.uploadedFiles ?? agent.uploadedFiles ?? [],
            basePrompt: null, // will be set below
            id: agent.id,
         };
         const basePrompt = generateDefaultBasePrompt(updatedAgentConfig);
         // Update the agent in the database with the new basePrompt and body fields
         const [updated] = await db
            .update(agentTable)
            .set({ ...body, basePrompt, updatedAt: new Date() })
            .where(
               and(
                  eq(agentTable.id, params.id),
                  eq(agentTable.userId, user.id),
               ),
            )
            .returning();
         if (!updated) {
            throw new NotFoundError(
               "Agent not found after update",
               "AGENT_NOT_FOUND",
            );
         }
         return { agent: updated };
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
            source: "brand_knowledge",
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

         // Also delete all knowledge chunks with sourceIdentifier matching the file's URL
         const deletedFile = currentFiles.find((file) =>
            file.fileUrl.includes(params.filename),
         );
         if (deletedFile) {
            // Debug log for troubleshooting
            console.log(
               "Deleting knowledge chunks for fileUrl:",
               deletedFile.fileUrl,
            );
            // Query for all knowledge chunks with this sourceIdentifier (normalize for safety)
            const chunks = await db.query.knowledgeChunk.findMany({
               where: eq(
                  knowledgeChunk.sourceIdentifier,
                  deletedFile.fileUrl.trim(),
               ),
               columns: { id: true, sourceIdentifier: true },
            });
            for (const chunk of chunks) {
               console.log(
                  "Found knowledge chunk for deletion:",
                  chunk.id,
                  chunk.sourceIdentifier,
               );
               await knowledgeChunkQueue.add("delete", {
                  action: "delete",
                  chunkId: chunk.id,
               });
            }
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
   )
   // List all knowledge chunks for an agent
   .get(
      "/:id/chunks",
      async ({ params, user }) => {
         // Ensure agent belongs to user
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }
         // Fetch all knowledge chunks for this agent
         const chunks = await db.query.knowledgeChunk.findMany({
            where: eq(knowledgeChunk.agentId, params.id),
         });
         return { chunks };
      },
      {
         auth: true,
         params: t.Object({ id: t.String() }),
      },
   )
   // Delete a specific knowledge chunk
   .delete(
      "/:id/chunks/:chunkId",
      async ({ params, user }) => {
         // Ensure agent belongs to user
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }
         // Ensure chunk exists and belongs to this agent
         const chunk = await db.query.knowledgeChunk.findFirst({
            where: and(
               eq(knowledgeChunk.id, params.chunkId),
               eq(knowledgeChunk.agentId, params.id),
            ),
         });
         if (!chunk) {
            throw new NotFoundError("Chunk not found", "CHUNK_NOT_FOUND");
         }
         // Delete the chunk (enqueue for deletion if needed)
         await knowledgeChunkQueue.add("delete", {
            action: "delete",
            chunkId: chunk.id,
         });
         return { success: true };
      },
      {
         auth: true,
         params: t.Object({ id: t.String(), chunkId: t.String() }),
      },
   )
   // List all content-requests for an agent
   .get(
      "/:id/content-requests",
      async ({ params, user }) => {
         // Ensure agent belongs to user
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent) {
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         }
         // Fetch all content-requests for this agent
         const requests = await db.query.contentRequest.findMany({
            where: eq(contentRequest.agentId, params.id),
            columns: {
               id: true,
               topic: true,
               briefDescription: true,
               targetLength: true,
               isCompleted: true,
               createdAt: true,
               updatedAt: true,
               agentId: true,
               generatedContentId: true,
            },
            orderBy: desc(contentRequest.createdAt),
         });
         return { requests };
      },
      {
         auth: true,
         params: t.Object({ id: t.String() }),
      },
   );
