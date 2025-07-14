import { authMiddleware } from "@api/integrations/auth";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable, knowledgeChunk } from "../schemas/agent-schema";
import { NotFoundError } from "../shared/errors";
import { knowledgeChunkQueue } from "@api/workers/knowledge-chunk-worker";

export const agentChunkRoutes = new Elysia()
   .use(authMiddleware)
   .get(
      "/:id/chunks",
      async ({ params, user }) => {
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent)
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
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
   .delete(
      "/:id/chunks/:chunkId",
      async ({ params, user }) => {
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent)
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         const chunk = await db.query.knowledgeChunk.findFirst({
            where: and(
               eq(knowledgeChunk.id, params.chunkId),
               eq(knowledgeChunk.agentId, params.id),
            ),
         });
         if (!chunk)
            throw new NotFoundError("Chunk not found", "CHUNK_NOT_FOUND");
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
   );
