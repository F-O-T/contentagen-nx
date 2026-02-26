import path from "node:path";
import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { LocalFilesystem, Workspace } from "@mastra/core/workspace";
import { Observability } from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";
import { PosthogExporter } from "@mastra/posthog";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { env as serverEnv } from "@packages/environment/server";
import type { ModelId } from "../models";
import { pgVectorStore } from "../utils";
import { contentNetworkAgent } from "./agents/content-network-agent";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
import { researchAgent } from "./agents/research-agent";
import { reviewerAgent } from "./agents/reviewer-agent";
import { seoAuditorAgent } from "./agents/seo-auditor-agent";
import { writerAgent } from "./agents/writer-agent";
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

const workspace = new Workspace({
   filesystem: new LocalFilesystem({
      basePath: path.resolve(import.meta.dirname, "./workspace"),
   }),
   skills: ["/skills"],
   bm25: true,
});
const observability = new Observability({
   configs: {
      posthog: {
         serviceName: "contentta-agents",
         exporters: [
            new PosthogExporter({
               apiKey: serverEnv.POSTHOG_KEY,
               host: serverEnv.POSTHOG_HOST,
               defaultDistinctId: "system",
            }),
         ],
      },
   },
});

export const mastra: Mastra = new Mastra({
   agents: {
      contentNetworkAgent,
      researchAgent,
      writerAgent,
      seoAuditorAgent,
      reviewerAgent,
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
