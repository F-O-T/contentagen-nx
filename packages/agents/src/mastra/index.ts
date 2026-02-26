import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { Observability } from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { env as serverEnv } from "@packages/environment/server";
import { PostHog } from "posthog-node";
import { PosthogExporter } from "@packages/posthog/llm/posthog-exporter";
import type { ModelId } from "../models";
import { pgVectorStore } from "../utils";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
import { unifiedContentAgent } from "./agents/unified-content-agent";
import { workspace } from "./workspace";

/**
 * Re-export RequestContext so consumers don't need to depend on @mastra/core directly.
 */
export type { RequestContext };

export type CustomRequestContext = {
   userId: string;
   writerId?: string;
   model?: ModelId;
   language?: string;
   writerInstructions?: InstructionMemoryItem[];
   // Generation parameter overrides (from model preset or user setting)
   temperature?: number;
   topP?: number;
   maxTokens?: number;
   frequencyPenalty?: number;
   presencePenalty?: number;
};

const mastraStorage = new PostgresStore({
   id: "mastra-storage",
   connectionString: serverEnv.PG_VECTOR_URL,
});

const posthogClient = new PostHog(serverEnv.POSTHOG_KEY, {
   flushAt: 20,
   flushInterval: 10000,
   host: serverEnv.POSTHOG_HOST,
});

const observability = new Observability({
   configs: {
      default: {
         serviceName: "contentta-agents",
         exporters: [new PosthogExporter(posthogClient, "system")],
      },
   },
});

export const mastra: Mastra = new Mastra({
   agents: {
      // Unified content agent (combines all workflows)
      unifiedContent: unifiedContentAgent,

      // Specialized agents (kept separate)
      fimAgent,
      inlineEditAgent,
   },
   vectors: { pgVector: pgVectorStore },
   storage: mastraStorage,
   workspace,
   observability,
});

export function createRequestContext(context: CustomRequestContext) {
   const requestContext = new RequestContext<CustomRequestContext>();
   requestContext.set("userId", context.userId);

   if (context.writerId) {
      requestContext.set("writerId", context.writerId);
   }
   if (context.model) {
      requestContext.set("model", context.model);
   }
   if (context.temperature !== undefined) {
      requestContext.set("temperature", context.temperature);
   }
   if (context.topP !== undefined) {
      requestContext.set("topP", context.topP);
   }
   if (context.maxTokens !== undefined) {
      requestContext.set("maxTokens", context.maxTokens);
   }
   if (context.frequencyPenalty !== undefined) {
      requestContext.set("frequencyPenalty", context.frequencyPenalty);
   }
   if (context.presencePenalty !== undefined) {
      requestContext.set("presencePenalty", context.presencePenalty);
   }
   if (context.language) {
      requestContext.set("language", context.language);
   }
   if (context.writerInstructions) {
      requestContext.set("writerInstructions", context.writerInstructions);
   }
   return requestContext;
}
export * from "@mastra/ai-sdk";
