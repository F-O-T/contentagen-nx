import { createTool } from "@mastra/core/tools";
import { createDb } from "@packages/database/client";
import { getWriterById } from "@packages/database/repositories/writer-repository";
import { env } from "@packages/environment/server";
import { AppError, propagateError } from "@packages/utils/errors";
export function getRagGuidelinesInstructions(): string {
   return `
## RAG INTEGRATION PERSONA TOOL
Retrieves RAG integration instructions that define how to query and utilize knowledge bases.
**When to use:** Before formulating search strategies or when unsure how to approach brand/competitor knowledge queries
**Parameters:**
- writerId (UUID): Writer identifier containing RAG integration configuration
**Returns:** RAG integration instructions or "No RAG integration specified"
**Strategy:** Call early in workflow to understand knowledge base structure and query patterns, then apply throughout research phase
`;
}
export const getRagGuidelinesTool = createTool({
   description:
      "Retrieve the RAG integration persona from the database for the strategist writer to use",
   execute: async (_inputData, context) => {
      const requestContext = context?.requestContext;
      if (!requestContext?.has("writerId")) {
         throw AppError.internal("Writer ID is required in request context");
      }
      const writerId = requestContext.get("writerId") as string;

      try {
         const dbClient = createDb({
            databaseUrl: env.DATABASE_URL,
         });

         const writer = await getWriterById(dbClient, writerId);
         const ragIntegration =
            writer?.personaConfig?.instructions?.ragIntegration;

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
   id: "get-rag-persona",
});
