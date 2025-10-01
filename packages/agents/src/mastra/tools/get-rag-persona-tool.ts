import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { z } from "zod";
import { AppError, propagateError } from "@packages/utils/errors";

export const getRagPersona = createTool({
   id: "get-rag-persona",
   description:
      "Retrieve the RAG integration persona from the database for the strategist agent to use",
   inputSchema: z.object({
      agentId: z
         .uuid()
         .describe(
            "The UUID of the agent to retrieve the RAG integration instructions for",
         ),
   }),
   execute: async ({ context }) => {
      const { agentId } = context;

      try {
         const dbClient = createDb({
            databaseUrl: serverEnv.DATABASE_URL,
         });

         const agent = await getAgentById(dbClient, agentId);
         const ragIntegration =
            agent.personaConfig.instructions?.ragIntegration;

         return {
            ragIntegration: ragIntegration || "No RAG integration specified",
         };
      } catch (error) {
         console.error("Failed to retrieve RAG persona:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to retrieve RAG persona: ${(error as Error).message}`,
         );
      }
   },
});
