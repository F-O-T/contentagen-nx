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

const _createAgent = createInsertSchema(agentTable);

export const agentRoutes = new Elysia({
   prefix: "/agents",
})
   .use(authMiddleware)
   .post(
      "/",
      async ({ body, user }) => {
         // Generate default base prompt for the agent
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
         // Update the agent fields
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
         // Fetch the updated agent (direct index access with type assertion)
         const agent = updated[0] as NonNullable<(typeof updated)[0]>;

         // List of fields that affect the prompt
         const promptFields = [
            "description",
            "formattingStyle",
            "contentType",
            "name",
            "targetAudience",
            "voiceTone",
            "language",
            "brandIntegration",
            "communicationStyle",
            "isActive",
            "uploadedFiles",
         ];
         // Check if any prompt-relevant field was updated
         // Use keyof typeof agent for better type safety
         const shouldRegeneratePrompt = promptFields.some((field) => {
            type AgentKey = keyof typeof agent;
            type BodyKey = keyof typeof body;

            if (field in agent && field in body) {
               const agentKey = field as AgentKey;
               const bodyKey = field as BodyKey;
               return (
                  body[bodyKey] !== undefined &&
                  body[bodyKey] !== agent[agentKey]
               );
            }
            return false;
         });

         let finalAgent = agent;
         if (shouldRegeneratePrompt) {
            // Ensure communicationStyle is always set
            const communicationStyle =
               agent.communicationStyle || "first_person";
            // Regenerate the basePrompt with the latest config, ensuring all required fields are present
            const basePrompt = generateDefaultBasePrompt({
               ...agent,
               description: agent.description ?? "",
               formattingStyle: agent.formattingStyle ?? "structured",
               contentType: agent.contentType ?? "blog_posts",
               name: agent.name ?? "Agent",
               createdAt: agent.createdAt ?? new Date(),
               targetAudience: agent.targetAudience ?? "general_public",
               voiceTone: agent.voiceTone ?? "professional",
               language: agent.language ?? "english",
               brandIntegration: agent.brandIntegration ?? "strict_guideline",
               communicationStyle,
               isActive: agent.isActive ?? true,
               totalDrafts: agent.totalDrafts ?? 0,
               totalPublished: agent.totalPublished ?? 0,
               lastGeneratedAt: agent.lastGeneratedAt ?? null,
               updatedAt: agent.updatedAt ?? new Date(),
               userId: agent.userId ?? "",
               uploadedFiles: agent.uploadedFiles ?? [],
               basePrompt: agent.basePrompt ?? null,
               id: agent.id,
            });
            // Update the agent's basePrompt in the database
            const [finalAgentRaw] = await db
               .update(agentTable)
               .set({ basePrompt })
               .where(eq(agentTable.id, params.id))
               .returning();
            finalAgent = finalAgentRaw ?? agent;
         }
         return { agent: finalAgent };
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
