import { authMiddleware } from "@api/integrations/auth";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable } from "../schemas/content-schema";
import { NotFoundError } from "../shared/errors";
import { uploadFile, getFile } from "../integrations/minio";
import { embeddingService, averageEmbeddings } from "../services/embedding";
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
            knowledgeBase: null,
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
            const basePrompt = generateDefaultBasePrompt(agent);

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

         // Update agent with new file
         const uploadedFile = {
            fileName: file.name,
            fileUrl,
            uploadedAt: new Date().toISOString(),
         };

         const currentFiles = agent.uploadedFiles || [];
         const updatedFiles = [...currentFiles, uploadedFile];

         // Rebuild knowledge base vector from all uploaded files
         try {
            const fileContents: string[] = [];

            // Fetch content for all files
            for (const file of updatedFiles) {
               const fileName = file.fileUrl.split("/").pop();
               if (fileName) {
                  const stream = await getFile(fileName);
                  const chunks: Buffer[] = [];

                  for await (const chunk of stream) {
                     chunks.push(
                        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                     );
                  }

                  const content = Buffer.concat(chunks).toString("utf-8");
                  fileContents.push(content);
               }
            }

            // Generate embeddings for all file contents
            const embeddings = await Promise.all(
               fileContents.map((content) =>
                  embeddingService.generateFileContentEmbedding(content),
               ),
            );

            // Average the embeddings to create knowledge base vector
            const knowledgeBaseVector = averageEmbeddings(embeddings);

            // Update agent with new files and knowledge base
            const updatedAgent = await db
               .update(agentTable)
               .set({
                  uploadedFiles: updatedFiles,
                  knowledgeBase: knowledgeBaseVector,
                  updatedAt: new Date(),
               })
               .where(eq(agentTable.id, params.id))
               .returning();

            return {
               success: true,
               file: uploadedFile,
               agent: updatedAgent[0],
            };
         } catch (embeddingError) {
            console.error(
               "Error generating knowledge base embedding:",
               embeddingError,
            );

            // Fall back to updating without knowledge base if embedding fails
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
               warning: "File uploaded but knowledge base embedding failed",
            };
         }
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

         // Rebuild knowledge base vector from remaining files
         try {
            let knowledgeBaseVector: number[] = [];

            if (updatedFiles.length > 0) {
               const fileContents: string[] = [];

               // Fetch content for remaining files
               for (const file of updatedFiles) {
                  const fileName = file.fileUrl.split("/").pop();
                  if (fileName) {
                     const stream = await getFile(fileName);
                     const chunks: Buffer[] = [];

                     for await (const chunk of stream) {
                        chunks.push(
                           Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk),
                        );
                     }

                     const content = Buffer.concat(chunks).toString("utf-8");
                     fileContents.push(content);
                  }
               }

               // Generate embeddings for remaining file contents
               const embeddings = await Promise.all(
                  fileContents.map((content) =>
                     embeddingService.generateFileContentEmbedding(content),
                  ),
               );

               // Average the embeddings to create knowledge base vector
               knowledgeBaseVector = averageEmbeddings(embeddings);
            } else {
               // No files left, use zero vector
               knowledgeBaseVector = new Array(1536).fill(0);
            }

            // Update agent with remaining files and new knowledge base
            const updatedAgent = await db
               .update(agentTable)
               .set({
                  uploadedFiles: updatedFiles,
                  knowledgeBase: knowledgeBaseVector,
                  updatedAt: new Date(),
               })
               .where(eq(agentTable.id, params.id))
               .returning();

            return {
               success: true,
               agent: updatedAgent[0],
            };
         } catch (embeddingError) {
            console.error(
               "Error rebuilding knowledge base after deletion:",
               embeddingError,
            );

            // Fall back to updating without knowledge base if embedding fails
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
               warning: "File deleted but knowledge base rebuilding failed",
            };
         }
      },
      {
         auth: true,
         params: t.Object({
            id: t.String(),
            filename: t.String(),
         }),
      },
   );
