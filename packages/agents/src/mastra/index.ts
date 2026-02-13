import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import type { ModelId } from "../models";
import { pgVectorStore } from "../utils";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
import { orchestratorAgent } from "./agents/orchestrator-agent";
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

export const mastra: Mastra = new Mastra({
   agents: {
      orchestratorAgent,
      writerAgent,
      fimAgent,
      inlineEditAgent,
   },
   vectors: { pgVector: pgVectorStore },
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
