import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { AppError, propagateError } from "@packages/utils/errors";
export function getAudienceProfileGuidelinesInstructions(): string {
   return `
## AUDIENCE PERSONA RETRIEVAL TOOL
Retrieves the target audience profile for content personalization.
**When to use:** Need to understand who you're writing for or tailor content to specific reader
**Parameters:**
- agentId (UUID): Agent identifier containing persona configuration
**Returns:** Audience profile details or "No audience profile specified"
**Note:** Call once per session to get audience context, then apply throughout conversation
`;
}
export const getAudienceProfileGuidelinesTool = createTool({
   id: "get-audience-persona",
   description:
      "Retrieve the audience profile persona from the database for the reader agent to impersonate",
   execute: async ({ runtimeContext }) => {
      if (!runtimeContext.has("agentId")) {
         throw AppError.internal("Agent ID is required in runtime context");
      }
      const agentId = runtimeContext.get("agentId") as string;
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
