import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { AppError, propagateError } from "@packages/utils/errors";
export function getWritingGuidelinesInstructions(): string {
   return `
## WRITING GUIDELINES TOOL
Retrieves specific writing rules, style preferences, and formatting requirements for content creation.
**When to use:** Before drafting content to understand style rules, tone preferences, and structural requirements
**Parameters:**
- agentId (UUID): Agent identifier containing writing guidelines configuration
**Returns:** Writing guidelines or "No writing guidelines specified"
**Strategy:** Call early in writing process to ensure content adheres to brand voice, formatting standards, and stylistic preferences throughout composition
`;
}
export const getWritingGuidelinesTool = createTool({
   id: "get-writing-guidelines",
   description: "Retrieve the writing guidelines for content creation",
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
         const writingGuidelines =
            agent.personaConfig.instructions?.writingGuidelines;

         return {
            writingGuidelines:
               writingGuidelines || "No writing guidelines specified",
         };
      } catch (error) {
         console.error("Failed to retrieve writing guidelines:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to retrieve writing guidelines: ${(error as Error).message}`,
         );
      }
   },
});
