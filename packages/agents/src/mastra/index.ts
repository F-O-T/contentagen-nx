import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import type { PgVector } from "@mastra/pg";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
import { pgVectorStore } from "./agents/shared";
import { writerAgent } from "./agents/writer-agent";

// Available models
export type ModelId =
   | "openrouter/x-ai/grok-4.1-fast"
   | "openrouter/minimax/minimax-m2.1"
   | "openrouter/mistralai/mistral-small-creative";

export type CustomRequestContext = {
   brandId?: string;
   userId: string;
   writerId?: string;
   // Fields for blog editor
   model?: ModelId;
   // Instruction memories (compiled into agent prompts)
   writerInstructions?: InstructionMemoryItem[];
};

// Only include vectors config if PgVector is available
const vectorsConfig: Record<string, PgVector> = pgVectorStore
   ? { pgVector: pgVectorStore }
   : {};

export const mastra = new Mastra({
   agents: {
      writerAgent,
      fimAgent,
      inlineEditAgent,
   },
   vectors: vectorsConfig,
   bundler: {
      externals: ["react-dom", "@logtail/pino", "pino"],
      transpilePackages: [
         "@packages/files/client",
         "@packages/environment/helpers",
         "@packages/environment/server",
         "@packages/database/client",
         "@packages/database/schema",
         "@packages/utils/errors",
         "@packages/utils/text",
      ],
   },
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
   if (context.writerInstructions) {
      requestContext.set("writerInstructions", context.writerInstructions);
   }
   return requestContext;
}

export { fimAgent } from "./agents/fim-agent";
export { inlineEditAgent } from "./agents/inline-edit-agent";
// Export agents for direct access
export { writerAgent } from "./agents/writer-agent";
