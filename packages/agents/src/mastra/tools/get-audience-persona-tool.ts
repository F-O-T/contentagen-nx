import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { z } from "zod";
import { AppError, propagateError } from "@packages/utils/errors";

export const getAudiencePersona = createTool({
   id: "get-audience-persona",
   description:
      "Retrieve the audience profile persona from the database for the reader agent to impersonate",
   inputSchema: z.object({
      agentId: z
         .uuid()
         .describe(
            "The UUID of the agent to retrieve the audience profile for",
         ),
   }),
   execute: async ({ context }) => {
      const { agentId } = context;

      try {
         const dbClient = createDb({
            databaseUrl: serverEnv.DATABASE_URL,
         });

         const { personaConfig } = await getAgentById(dbClient, agentId);
         const audienceProfile = personaConfig.instructions?.audienceProfile;

         return {
            audienceProfile: audienceProfile || "No audience profile specified",
         };
      } catch (error) {
         console.error("Failed to retrieve audience persona:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to retrieve audience persona: ${(error as Error).message}`,
         );
      }
   },
});
