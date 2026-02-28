import { ORPCError } from "@orpc/server";
import {
   type CustomRequestContext,
   createRequestContext,
   mastra,
   type RequestContext,
} from "@packages/agents";
import {
   AUTOCOMPLETE_MODELS,
   type AutocompleteModelId,
   CONTENT_MODELS,
   type ContentModelId,
   DEFAULT_AUTOCOMPLETE_MODEL_ID,
   DEFAULT_CONTENT_MODEL_ID,
   getModelPreset,
} from "@packages/agents/models";
import { getProductSettings } from "@packages/database/repositories/product-settings-repository";
import { teamMember } from "@packages/database/schemas/auth";
import { content } from "@packages/database/schemas/content";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { writer } from "@packages/database/schemas/writer";
import {
   AI_EVENTS,
   emitAiAgentAction,
   emitAiCompletion,
} from "@packages/events/ai";
import {
   enforceCreditBudget,
   trackCreditUsage,
} from "@packages/events/credits";
import { createEmitFn } from "@packages/events/emit";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { ChatChunk, FIMChunk } from "@/features/editor/schemas";
import { protectedProcedure } from "../server";

// =============================================================================
// Agent Streaming Procedures
// =============================================================================
//
// NOTE: Product settings for language and model selection are now integrated.
// RAG and search tool settings (ragEnabled, ragMaxResults, ragMinScore,
// searchDepth, searchMaxResults, etc.) require tool-level changes to read
// from requestContext. Currently, tools use hardcoded defaults defined in
// their input schemas.
//
// TODO: Modify RAG tools (search-previous-content-tool, graph-search-tool) to:
//   - Read ragEnabled, ragMaxResults, ragMinScore from requestContext
//   - Use these as defaults when minScore/topK are not explicitly provided
//
// TODO: Modify search tools (web-search-tool, serp-analysis-tool, etc.) to:
//   - Read searchDepth, searchMaxResults, includeSearchAnswer, searchTimeRange,
//     preferredSearchProvider, requireAuthoritativeSources, minCredibility
//   - Use these as defaults when parameters are not explicitly provided
// =============================================================================

/**
 * Copilot ghost text streaming completion
 * Lightweight completion for CopilotPlugin using fimAgent
 */
export const copilotStream = protectedProcedure
   .input(
      z.object({
         prefix: z.string(),
         suffix: z.string().optional(),
         contentId: z.string().optional(),
      }),
   )
   .handler(async function* ({ context, input }) {
      const { userId, db, organizationId, posthog, teamId, headers } = context;

      await enforceCreditBudget(db, organizationId, "ai");

      // Fetch product settings for AI configuration
      const settings = await getProductSettings(db, teamId);
      const aiDefaults = settings?.aiDefaults ?? {};

      // Get the FIM agent from Mastra
      const fimAgent = mastra.getAgent("fimAgent");

      // Get autocomplete model and its preset
      const autocompleteModelId = (aiDefaults.autocompleteModel ??
         DEFAULT_AUTOCOMPLETE_MODEL_ID) as AutocompleteModelId;
      const autocompletePreset = getModelPreset(
         AUTOCOMPLETE_MODELS,
         autocompleteModelId,
         DEFAULT_AUTOCOMPLETE_MODEL_ID,
      );

      // Create request context for the agent with settings
      const requestContext = createRequestContext({
         userId,
         language:
            aiDefaults.defaultLanguage ??
            getRequestLanguage(headers) ??
            "pt-BR",
         model: autocompleteModelId,
         // Use user override if set, otherwise fall back to model preset
         temperature:
            aiDefaults.autocompleteTemperature ??
            autocompletePreset.temperature,
         topP: autocompletePreset.topP,
         maxTokens: autocompletePreset.maxTokens,
      } as CustomRequestContext);

      // Build the copilot prompt
      const prompt = buildCopilotPrompt(input.prefix, input.suffix);

      const startTime = Date.now();

      try {
         // Stream the agent response
         const result = await fimAgent.stream(
            [{ role: "user", content: prompt }],
            {
               requestContext: requestContext as RequestContext<unknown>,
            } as unknown as Parameters<typeof fimAgent.stream>[1],
         );

         // Yield chunks as FIMChunk format
         let _fullText = "";
         for await (const chunk of result.textStream) {
            _fullText += chunk;
            yield {
               text: chunk,
               done: false,
            } satisfies FIMChunk;
         }

         const latencyMs = Date.now() - startTime;

         // Emit event and increment credit usage (failure-tolerant)
         try {
            await emitAiCompletion(
               createEmitFn(db, posthog),
               { organizationId, userId, teamId },
               {
                  model: "fimAgent",
                  provider: "openrouter",
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0,
                  latencyMs,
                  streamed: true,
               },
            );
            await trackCreditUsage(
               db,
               AI_EVENTS["ai.completion"],
               organizationId,
               "ai",
            );
         } catch {
            // Event tracking must not break the streaming flow
         }

         // Final chunk with metadata
         yield {
            text: "",
            done: true,
            metadata: {
               stopReason: "natural",
               latencyMs,
            },
         } satisfies FIMChunk;
      } catch (error) {
         console.error("[copilotStream] FIM agent error:", error);
         yield {
            text: "",
            done: true,
            metadata: {
               stopReason: "error",
               latencyMs: Date.now() - startTime,
            },
         } satisfies FIMChunk;
      }
   });

/**
 * AI Command streaming
 * Executes AI commands using unifiedContent agent, yields ChatChunk events
 */
export const aiCommandStream = protectedProcedure
   .input(
      z.object({
         prompt: z.string(),
         contentId: z.string().optional(),
         writerId: z.string().optional(),
         model: z.string().optional(),
         language: z.string().optional(),
      }),
   )
   .handler(async function* ({ context, input }) {
      const { userId, db, organizationId, posthog, teamId, headers } = context;

      await enforceCreditBudget(db, organizationId, "ai");

      // Fetch product settings for AI configuration
      const settings = await getProductSettings(db, teamId);
      const aiDefaults = settings?.aiDefaults ?? {};

      // Get the unified content agent from Mastra
      const unifiedAgent = mastra.getAgent("tecoAgent");

      const contentModelId = (input.model ??
         aiDefaults.contentModel ??
         DEFAULT_CONTENT_MODEL_ID) as ContentModelId;
      const contentPreset = getModelPreset(
         CONTENT_MODELS,
         contentModelId,
         DEFAULT_CONTENT_MODEL_ID,
      );

      // Fetch writer instructions if a writerId is provided
      let writerInstructions: InstructionMemoryItem[] | undefined;
      if (input.writerId) {
         const writerRecord = await db.query.writer.findFirst({
            where: and(
               eq(writer.id, input.writerId),
               eq(writer.teamId, teamId),
            ),
         });
         if (writerRecord?.instructionMemories) {
            writerInstructions = (
               writerRecord.instructionMemories as InstructionMemoryItem[]
            ).slice(0, 10);
         }
      }

      // Create request context with settings, falling back to product defaults
      const requestContext = createRequestContext({
         userId,
         contentId: input.contentId,
         writerId: input.writerId,
         writerInstructions,
         language:
            input.language ??
            aiDefaults.defaultLanguage ??
            getRequestLanguage(headers) ??
            "pt-BR",
         model: contentModelId,
         temperature:
            aiDefaults.contentTemperature ?? contentPreset.temperature,
         topP: contentPreset.topP,
         maxTokens: aiDefaults.contentMaxTokens ?? contentPreset.maxTokens,
         frequencyPenalty: contentPreset.frequencyPenalty,
         presencePenalty: contentPreset.presencePenalty,
      } as CustomRequestContext);

      let stepIndex = 0;
      const startTime = Date.now();

      try {
         // Stream the agent response
         const result = await unifiedAgent.stream(
            [{ role: "user", content: input.prompt }],
            {
               requestContext: requestContext as RequestContext<unknown>,
            } as unknown as Parameters<typeof unifiedAgent.stream>[1],
         );

         // Yield full stream events including tool calls
         for await (const event of result.fullStream) {
            const chunk = event as unknown as {
               type: string;
               payload?: {
                  textDelta?: string;
                  toolCallId?: string;
                  toolName?: string;
                  args?: Record<string, unknown>;
                  result?: unknown;
               };
               textDelta?: string;
               toolCallId?: string;
               toolName?: string;
               args?: Record<string, unknown>;
               result?: unknown;
            };

            switch (chunk.type) {
               case "text-delta": {
                  const payload = chunk.payload as unknown as {
                     textDelta?: string;
                  };
                  const textDelta = chunk.textDelta ?? payload?.textDelta;
                  if (!textDelta) break;
                  yield {
                     type: "text",
                     text: textDelta,
                  } satisfies ChatChunk;
                  break;
               }

               case "tool-call": {
                  const toolCallId =
                     chunk.toolCallId ?? chunk.payload?.toolCallId;
                  const toolName = chunk.toolName ?? chunk.payload?.toolName;
                  const args = chunk.args ?? chunk.payload?.args;
                  if (!toolCallId || !toolName || !args) break;

                  yield {
                     type: "tool_call_start",
                     toolCall: {
                        id: toolCallId,
                        name: toolName,
                        args,
                     },
                  } satisfies ChatChunk;
                  break;
               }

               case "tool-result": {
                  const toolCallId =
                     chunk.toolCallId ?? chunk.payload?.toolCallId;
                  const toolName = chunk.toolName ?? chunk.payload?.toolName;
                  const resultValue = chunk.result ?? chunk.payload?.result;
                  if (!toolCallId || !toolName) break;

                  yield {
                     type: "tool_call_complete",
                     toolCallId,
                     toolName,
                     result: resultValue,
                  } satisfies ChatChunk;
                  break;
               }

               case "step-start":
                  yield {
                     type: "step_start",
                     stepIndex,
                  } satisfies ChatChunk;
                  break;

               case "step-finish":
                  yield {
                     type: "step_complete",
                     stepIndex,
                  } satisfies ChatChunk;
                  stepIndex++;
                  break;
            }
         }

         const latencyMs = Date.now() - startTime;

         // Emit event and increment credit usage (failure-tolerant)
         try {
            await emitAiCompletion(
               createEmitFn(db, posthog),
               { organizationId, userId, teamId },
               {
                  model: "unifiedContent",
                  provider: "openrouter",
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0,
                  latencyMs,
                  streamed: true,
               },
            );
            await trackCreditUsage(
               db,
               AI_EVENTS["ai.completion"],
               organizationId,
               "ai",
            );
         } catch {
            // Event tracking must not break the streaming flow
         }

         // Final chunk
         yield {
            type: "done",
         } satisfies ChatChunk;
      } catch (error) {
         // Yield error indication
         yield {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
         } satisfies ChatChunk;
      }
   });

/**
 * Execute unified content agent
 * New unified agent that combines all workflows (planning, research, writing, SEO, review)
 */
export const executeUnifiedAgent = protectedProcedure
   .input(
      z.object({
         teamId: z.string().uuid(),
         contentId: z.string().uuid(),
         prompt: z.string().min(1).max(10000),
         writerId: z.string().uuid().optional(),
         model: z.string().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { teamId, contentId, prompt, writerId, model } = input;
      const { userId, db, organizationId, posthog } = context;

      // Fetch product settings for AI configuration
      const settings = await getProductSettings(db, teamId);
      const aiDefaults = settings?.aiDefaults ?? {};

      // Verify team membership
      const membership = await db.query.teamMember.findFirst({
         where: and(
            eq(teamMember.teamId, teamId),
            eq(teamMember.userId, userId),
         ),
      });

      if (!membership) {
         throw new ORPCError("FORBIDDEN", {
            message: "You don't have access to this team",
         });
      }

      // Get content
      const contentRecord = await db.query.content.findFirst({
         where: and(eq(content.id, contentId), eq(content.teamId, teamId)),
      });

      if (!contentRecord) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found" });
      }

      // Get writer instructions if writerId provided
      let writerInstructions: InstructionMemoryItem[] | undefined;
      if (writerId) {
         const writerRecord = await db.query.writer.findFirst({
            where: and(eq(writer.id, writerId), eq(writer.teamId, teamId)),
         });
         if (writerRecord?.instructionMemories) {
            writerInstructions = (
               writerRecord.instructionMemories as InstructionMemoryItem[]
            ).slice(0, 10);
         }
      }

      // Enforce credit budget
      await enforceCreditBudget(db, organizationId, "ai");

      const contentModelId = (model ??
         aiDefaults.contentModel ??
         DEFAULT_CONTENT_MODEL_ID) as ContentModelId;
      const contentPreset = getModelPreset(
         CONTENT_MODELS,
         contentModelId,
         DEFAULT_CONTENT_MODEL_ID,
      );

      // Create request context
      const requestContext = createRequestContext({
         userId,
         writerId,
         model: contentModelId,
         language: aiDefaults.defaultLanguage ?? "pt-BR",
         writerInstructions,
         temperature:
            aiDefaults.contentTemperature ?? contentPreset.temperature,
         topP: contentPreset.topP,
         maxTokens: aiDefaults.contentMaxTokens ?? contentPreset.maxTokens,
         frequencyPenalty: contentPreset.frequencyPenalty,
         presencePenalty: contentPreset.presencePenalty,
      } as CustomRequestContext);

      const startTime = Date.now();

      // Execute unified agent
      const agent = mastra.getAgent("tecoAgent");
      const result = await agent.generate(prompt, {
         requestContext: requestContext as RequestContext<unknown>,
      });

      const latencyMs = Date.now() - startTime;

      // Emit agent event and track credits (failure-tolerant)
      try {
         await emitAiAgentAction(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            {
               agentId: "unified-content-agent",
               contentId,
               action: "generate",
               model: contentModelId,
               provider: "openrouter",
               promptTokens: result.usage?.inputTokens ?? 0,
               completionTokens: result.usage?.outputTokens ?? 0,
               totalTokens:
                  (result.usage?.inputTokens ?? 0) +
                  (result.usage?.outputTokens ?? 0),
               latencyMs,
            },
         );
         await trackCreditUsage(
            db,
            AI_EVENTS["ai.agent_action"],
            organizationId,
            "ai",
         );
      } catch {
         // Event tracking must not break the flow
      }

      return {
         text: result.text,
         toolCalls: result.toolCalls,
         usage: result.usage,
      };
   });

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build Copilot prompt from prefix and optional suffix
 */
function buildCopilotPrompt(prefix: string, suffix?: string): string {
   let prompt = `Complete the following text naturally and concisely:\n\n${prefix}`;

   if (suffix) {
      prompt += `\n\n[Text after cursor]:\n${suffix}`;
   }

   return prompt;
}

/**
 * Resolve language from request headers for agent context.
 */
function getRequestLanguage(headers: Headers): string | undefined {
   const raw = headers.get("accept-language");
   if (!raw) return undefined;
   const [primary] = raw.split(",");
   return primary?.trim() || undefined;
}
