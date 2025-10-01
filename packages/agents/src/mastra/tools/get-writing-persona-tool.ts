import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { z } from "zod";
import { AppError, propagateError } from "@packages/utils/errors";

export const getWritingPersona = createTool({
   id: "get-writing-persona",
   description:
      "Retrieve the writing persona including writing guidelines and agent metadata (name + description) for content creation",
   inputSchema: z.object({
      agentId: z
         .uuid()
         .describe("The UUID of the agent to retrieve the writing persona for"),
   }),
   execute: async ({ context }) => {
      const { agentId } = context;

      try {
         const dbClient = createDb({
            databaseUrl: serverEnv.DATABASE_URL,
         });

         const agent = await getAgentById(dbClient, agentId);
         const writingGuidelines =
            agent.personaConfig.instructions?.writingGuidelines;
         const metadata = agent.personaConfig.metadata;

         return {
            personaName: metadata.name,
            personaDescription: metadata.description,
            writingGuidelines:
               writingGuidelines || "No writing guidelines specified",
         };
      } catch (error) {
         console.error("Failed to retrieve writing persona:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to retrieve writing persona: ${(error as Error).message}`,
         );
      }
   },
});
