import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { AppError, propagateError } from "@packages/utils/errors";
export function getWriterPersonaInstructions(): string {
   return `
## WRITING PERSONA TOOL
Retrieves agent identity (name, description) that defines the voice and style for content creation.
**When to use:** Before writing content to understand the persona you're embodying
**Parameters:**
- agentId (UUID): Agent identifier containing persona metadata
**Returns:** 
- personaName: Agent's display name
- personaDescription: Detailed persona characteristics and writing guidelines
**Strategy:** Call once at content creation start to establish consistent voice, tone, and style throughout writing
`;
}
export const getWriterPersonaTool = createTool({
   id: "get-writing-persona",
   description:
      "Retrieve the writer persona including agent metadata (name + description) for content creation",
   execute: async ({ runtimeContext }) => {
      if (!runtimeContext.has("agentId")) {
         throw AppError.internal("Agent ID is required in runtime context");
      }
      const agentId = runtimeContext.get("agentId") as string;

      try {
         const dbClient = createDb({
            databaseUrl: serverEnv.DATABASE_URL,
         });

         const agent = await getAgentById(dbClient, agentId);
         const metadata = agent.personaConfig.metadata;

         return {
            personaName: metadata.name,
            personaDescription: metadata.description,
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
