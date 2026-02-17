import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { PostgresStore } from "@mastra/pg";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { env as serverEnv } from "@packages/environment/server";
import type { ModelId } from "../models";
import { pgVectorStore } from "../utils";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
import { orchestratorAgent } from "./agents/orchestrator-agent";
import { unifiedContentAgent } from "./agents/unified-content-agent";
import { writerAgent } from "./agents/writer-agent";

/**
 * Re-export RequestContext so consumers don't need to depend on @mastra/core directly.
 */
export type { RequestContext };

export type CustomRequestContext = {
   brandId?: string;
   userId: string;
   writerId?: string;
   model?: ModelId;
   language?: string;
   writerInstructions?: InstructionMemoryItem[];
};

const mastraStorage = new PostgresStore({
   id: "mastra-storage",
   connectionString: serverEnv.PG_VECTOR_URL,
});

export const mastra: Mastra = new Mastra({
   agents: {
      // New unified agent (replaces orchestrator + sub-agents)
      unifiedContent: unifiedContentAgent,

      // Specialized agents (kept separate)
      fimAgent,
      inlineEditAgent,

      // DEPRECATED: Will be removed in next phase
      orchestratorAgent,
      writerAgent,
   },
   vectors: { pgVector: pgVectorStore },
   storage: mastraStorage,
});

export function createRequestContext(context: CustomRequestContext) {
   const requestContext = new RequestContext<CustomRequestContext>();
   requestContext.set("userId", context.userId);

   if (context.brandId) {
      requestContext.set("brandId", context.brandId);
   }
   if (context.writerId) {
      requestContext.set("writerId", context.writerId);
   }
   if (context.model) {
      requestContext.set("model", context.model);
   }
   if (context.language) {
      requestContext.set("language", context.language);
   }
   if (context.writerInstructions) {
      requestContext.set("writerInstructions", context.writerInstructions);
   }
   return requestContext;
}
