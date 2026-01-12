import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { PinoLogger } from "@mastra/loggers";
import type { PgVector } from "@mastra/pg";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
import { planAgent } from "./agents/plan-agent";
import { pgVectorStore } from "./agents/shared";
import { writerAgent } from "./agents/writer-agent";
import type { ContentPlan } from "./schemas/plan-schema";

// Chat modes for blog editor
export type ChatMode = "plan" | "writer";

// Available models
export type ModelId =
   | "x-ai/grok-4.1-fast"
   | "z-ai/glm-4.7"
   | "mistralai/mistral-small-creative";

export type CustomRequestContext = {
   brandId?: string;
   userId: string;
   agentId?: string;
   // Fields for blog editor
   mode?: ChatMode;
   model?: ModelId;
   activePlan?: ContentPlan;
   // Instruction memories (compiled into agent prompts)
   agentInstructions?: InstructionMemoryItem[];
};

// Only include vectors config if PgVector is available
const vectorsConfig: Record<string, PgVector> = pgVectorStore
   ? { pgVector: pgVectorStore }
   : {};

export const mastra = new Mastra({
   agents: {
      planAgent,
      writerAgent,
      fimAgent,
      inlineEditAgent,
   },
   vectors: vectorsConfig,
   bundler: {
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
   logger: new PinoLogger({
      level: "info",
      name: "Mastra",
   }),
});

export function createRequestContext(context: CustomRequestContext) {
   const requestContext = new RequestContext<CustomRequestContext>();
   requestContext.set("userId", context.userId);

   if (context.brandId) {
      requestContext.set("brandId", context.brandId);
   }
   if (context.agentId) {
      requestContext.set("agentId", context.agentId);
   }
   if (context.mode) {
      requestContext.set("mode", context.mode);
   }
   if (context.model) {
      requestContext.set("model", context.model);
   }
   if (context.activePlan) {
      requestContext.set("activePlan", context.activePlan);
   }
   if (context.agentInstructions) {
      requestContext.set("agentInstructions", context.agentInstructions);
   }
   return requestContext;
}

export { fimAgent } from "./agents/fim-agent";
export { inlineEditAgent } from "./agents/inline-edit-agent";
// Export agents for direct access
export { planAgent } from "./agents/plan-agent";
export { writerAgent } from "./agents/writer-agent";

// Export plan schemas
export {
   type ContentPlan,
   ContentPlanSchema,
   type PlanStep,
   PlanStepSchema,
   type ResearchInsights,
   ResearchInsightsSchema,
} from "./schemas/plan-schema";
