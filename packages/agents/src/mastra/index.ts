import { Mastra } from "@mastra/core/mastra";
import { RequestContext } from "@mastra/core/request-context";
import { Observability } from "@mastra/observability";
import { PostgresStore } from "@mastra/pg";
import { PosthogExporter } from "@mastra/posthog";
import type { DatabaseInstance } from "@packages/database/client";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { env as serverEnv } from "@packages/environment/server";
import type { ModelId } from "../models";
import { pgVectorStore } from "../utils";
import { fimAgent } from "./agents/fim-agent";
import { inlineEditAgent } from "./agents/inline-edit-agent";
import { tecoAgent } from "./agents/teco-agent";
import { contentCreationWorkflow } from "./workflows/content-creation-workflow";
import { workspace } from "./workspace-instance";
export type { RequestContext };

export type CustomRequestContext = {
   userId: string;
   writerId?: string;
   contentId?: string;
   teamId?: string;
   organizationId?: string;
   memberId?: string;
   db?: DatabaseInstance;
   model?: ModelId;
   language?: string;
   writerInstructions?: InstructionMemoryItem[];
   // Generation parameter overrides (from model preset or user setting)
   temperature?: number;
   topP?: number;
   maxTokens?: number;
   frequencyPenalty?: number;
   presencePenalty?: number;
   // Extended thinking budget in tokens (0 = disabled)
   thinkingBudget?: number;
   onBodyUpdate?: (
      toolName: string,
      output: Record<string, unknown>,
   ) => Promise<void>;
   onMetaUpdate?: (patch: Record<string, unknown>) => Promise<void>;
   getContentBody?: () => Promise<{ markdown: string; wordCount: number } | null>;
   // Mode-based context for tecoAgent
   mode?: string;
   contentTitle?: string;
   contentKeywords?: string[];
   contentStatus?: string;
   contentWordCount?: number;
};

const mastraStorage = new PostgresStore({
   id: "mastra-storage",
   connectionString: serverEnv.PG_VECTOR_URL,
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
      fimAgent,
      inlineEditAgent,
      tecoAgent,
   },
   workflows: {
      contentCreationWorkflow,
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
   if (context.contentId) {
      requestContext.set("contentId", context.contentId);
   }
   if (context.teamId) {
      requestContext.set("teamId", context.teamId);
   }
   if (context.organizationId) {
      requestContext.set("organizationId", context.organizationId);
   }
   if (context.memberId) {
      requestContext.set("memberId", context.memberId);
   }
   if (context.db) {
      requestContext.set("db", context.db);
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
   if (context.thinkingBudget !== undefined && context.thinkingBudget > 0) {
      requestContext.set("thinkingBudget", context.thinkingBudget);
   }
   if (context.language) {
      requestContext.set("language", context.language);
   }
   if (context.writerInstructions) {
      requestContext.set("writerInstructions", context.writerInstructions);
   }
   if (context.onBodyUpdate) {
      requestContext.set("onBodyUpdate", context.onBodyUpdate);
   }
   if (context.onMetaUpdate) {
      requestContext.set("onMetaUpdate", context.onMetaUpdate);
   }
   if (context.getContentBody) {
      requestContext.set("getContentBody", context.getContentBody);
   }
   if (context.mode) {
      requestContext.set("mode", context.mode);
   }
   if (context.contentTitle) {
      requestContext.set("contentTitle", context.contentTitle);
   }
   if (context.contentKeywords) {
      requestContext.set("contentKeywords", context.contentKeywords);
   }
   if (context.contentStatus) {
      requestContext.set("contentStatus", context.contentStatus);
   }
   if (context.contentWordCount !== undefined) {
      requestContext.set("contentWordCount", context.contentWordCount);
   }
   return requestContext;
}
export { contentCreationWorkflow };
export { handleWorkflowStream } from "@mastra/ai-sdk";
export * from "@mastra/ai-sdk";
