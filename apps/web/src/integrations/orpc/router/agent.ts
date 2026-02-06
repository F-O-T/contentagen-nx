import type { RequestContext } from "@mastra/core/request-context";
import {
   type CustomRequestContext,
   createRequestContext,
   mastra,
} from "@packages/agents";
import { getRedisConnection } from "@packages/redis/connection";
import type { DatabaseInstance } from "@packages/database/client";
import {
   addChatMessage,
   getOrCreateChatSession,
} from "@packages/database/repositories/chat-repository";
import type { StoredToolCall } from "@packages/database/schemas/chat";
import { subscription } from "@packages/database/schemas/auth";
import { AI_EVENTS, emitAiChatMessage, emitAiCompletion } from "@packages/events/ai";
import { checkCreditBudget, incrementCreditUsage } from "@packages/events/credits";
import { getEventPrice } from "@packages/events/utils";
import { PlanName } from "@packages/stripe/constants";
import { ORPCError } from "@orpc/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import {
   type ChatChunk,
   type EditChunk,
   EditRequestSchema,
   type FIMChunk,
   FIMRequestSchema,
} from "@/features/editor/schemas";
import { protectedProcedure } from "../server";

// =============================================================================
// Helpers
// =============================================================================

const VALID_PLAN_NAMES = new Set<string>(Object.values(PlanName));

async function resolveOrganizationPlan(
   db: DatabaseInstance,
   organizationId: string,
): Promise<PlanName> {
   const [sub] = await db
      .select({ plan: subscription.plan })
      .from(subscription)
      .where(
         and(
            eq(subscription.referenceId, organizationId),
            or(
               eq(subscription.status, "active"),
               eq(subscription.status, "trialing"),
            ),
         ),
      )
      .limit(1);

   if (!sub || !VALID_PLAN_NAMES.has(sub.plan)) {
      return PlanName.FREE;
   }

   return sub.plan as PlanName;
}

async function enforceCreditBudget(
   db: DatabaseInstance,
   organizationId: string,
): Promise<void> {
   const redis = getRedisConnection();
   if (!redis) return;

   const plan = await resolveOrganizationPlan(db, organizationId);
   try {
      await checkCreditBudget({ redis, organizationId, plan, pool: "ai" });
   } catch (error) {
      throw new ORPCError("FORBIDDEN", {
         message: error instanceof Error ? error.message : "Crédito esgotado.",
      });
   }
}

async function trackAiCreditUsage(
   db: DatabaseInstance,
   eventName: string,
   organizationId: string,
): Promise<void> {
   const redis = getRedisConnection();
   if (!redis) return;

   const price = await getEventPrice(db, eventName);
   await incrementCreditUsage(redis, organizationId, "ai", Number(price.amount));
}

// =============================================================================
// Agent Streaming Procedures
// =============================================================================

/**
 * FIM (Fill-in-Middle) streaming completion
 * Uses Mastra's fimAgent to provide intelligent text completion
 */
export const fimStream = protectedProcedure
   .input(FIMRequestSchema)
   .handler(async function* ({ context, input }) {
      const { userId, db, organizationId, posthog } = context;

      await enforceCreditBudget(db, organizationId);

      // Get the FIM agent from Mastra
      const fimAgent = mastra.getAgent("fimAgent");

      // Create request context for the agent
      const requestContext = createRequestContext({
         userId,
      } as CustomRequestContext);

      // Build the prompt from FIM request
      const prompt = buildFIMPrompt(input);

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
         let fullText = "";
         for await (const chunk of result.textStream) {
            fullText += chunk;
            yield {
               text: chunk,
               done: false,
            } satisfies FIMChunk;
         }

         const latencyMs = Date.now() - startTime;

         // Emit event and increment credit usage (failure-tolerant)
         try {
            await emitAiCompletion(
               { db, posthog, organizationId, userId },
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
            await trackAiCreditUsage(db, AI_EVENTS["ai.completion"], organizationId);
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
         // Yield error chunk
         yield {
            text: "",
            done: true,
            metadata: {
               stopReason: "stop_sequence",
               latencyMs: Date.now() - startTime,
            },
         } satisfies FIMChunk;
      }
   });

/**
 * Edit streaming completion (Ctrl+K)
 * Uses Mastra's inlineEditAgent for text transformations
 */
export const editStream = protectedProcedure
   .input(EditRequestSchema)
   .handler(async function* ({ context, input }) {
      const { userId, db, organizationId, posthog } = context;

      await enforceCreditBudget(db, organizationId);

      // Get the inline edit agent from Mastra
      const editAgent = mastra.getAgent("inlineEditAgent");

      // Create request context
      const requestContext = createRequestContext({
         userId,
      } as CustomRequestContext);

      // Build the prompt from edit request
      const prompt = buildEditPrompt(input);

      const startTime = Date.now();

      try {
         // Stream the agent response
         const result = await editAgent.stream(
            [{ role: "user", content: prompt }],
            {
               requestContext: requestContext as RequestContext<unknown>,
            } as unknown as Parameters<typeof editAgent.stream>[1],
         );

         // Yield chunks as EditChunk format
         let fullText = "";
         for await (const chunk of result.textStream) {
            fullText += chunk;
            yield {
               text: chunk,
               done: false,
            } satisfies EditChunk;
         }

         const latencyMs = Date.now() - startTime;

         // Emit event and increment credit usage (failure-tolerant)
         try {
            await emitAiCompletion(
               { db, posthog, organizationId, userId },
               {
                  model: "inlineEditAgent",
                  provider: "openrouter",
                  promptTokens: 0,
                  completionTokens: 0,
                  totalTokens: 0,
                  latencyMs,
                  streamed: true,
               },
            );
            await trackAiCreditUsage(db, AI_EVENTS["ai.completion"], organizationId);
         } catch {
            // Event tracking must not break the streaming flow
         }

         // Final chunk
         yield {
            text: "",
            done: true,
         } satisfies EditChunk;
      } catch (error) {
         // Yield error indication
         yield {
            text: "",
            done: true,
         } satisfies EditChunk;
      }
   });

/**
 * Chat streaming completion
 * Uses Mastra's writerAgent for chat conversations
 * Yields full stream events including tool calls
 * Saves messages to database for persistence
 */
export const chatStream = protectedProcedure
   .input(
      z.object({
         message: z.string(),
         contentId: z.string().uuid().optional(),
         sessionId: z.string().optional(),
      }),
   )
   .handler(async function* ({ context, input }) {
      const { userId, db, organizationId, posthog } = context;

      await enforceCreditBudget(db, organizationId);

      // Get or create chat session
      let session: Awaited<ReturnType<typeof getOrCreateChatSession>> | null =
         null;
      if (input.contentId) {
         session = await getOrCreateChatSession(
            db,
            input.contentId,
            organizationId,
         );
      }

      // Save user message to database
      if (session) {
         await addChatMessage(db, session.id, "user", input.message);
      }

      // Get the writer agent from Mastra for chat
      const writerAgent = mastra.getAgent("writerAgent");

      // Create request context
      const requestContext = createRequestContext({
         userId,
         contentId: input.contentId,
      } as CustomRequestContext);

      let stepIndex = 0;

      // Collect assistant message data during streaming
      let assistantText = "";
      const toolCalls: StoredToolCall[] = [];

      const startTime = Date.now();

      try {
         // Stream the agent response
         const result = await writerAgent.stream(
            [{ role: "user", content: input.message }],
            {
               requestContext: requestContext as RequestContext<unknown>,
            } as unknown as Parameters<typeof writerAgent.stream>[1],
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
                  assistantText += textDelta;
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

                  // Add to tool calls collection
                  toolCalls.push({
                     id: toolCallId,
                     name: toolName,
                     args,
                     status: "completed" as const,
                  });

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
                  const result = chunk.result ?? chunk.payload?.result;
                  if (!toolCallId || !toolName) break;

                  // Update tool call with result
                  const toolCall = toolCalls.find((tc) => tc.id === toolCallId);
                  if (toolCall) {
                     toolCall.result = result;
                     toolCall.executedAt = Date.now();
                  }

                  yield {
                     type: "tool_call_complete",
                     toolCallId,
                     toolName,
                     result,
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

         // Save assistant message to database with tool calls
         if (session) {
            await addChatMessage(
               db,
               session.id,
               "assistant",
               assistantText,
               undefined, // selectionContext
               toolCalls.length > 0 ? toolCalls : undefined,
            );
         }

         const latencyMs = Date.now() - startTime;

         // Emit event and increment credit usage (failure-tolerant)
         try {
            if (session) {
               await emitAiChatMessage(
                  { db, posthog, organizationId, userId },
                  {
                     chatId: session.id,
                     contentId: input.contentId,
                     model: "writerAgent",
                     provider: "openrouter",
                     role: "assistant",
                     promptTokens: 0,
                     completionTokens: 0,
                     totalTokens: 0,
                     latencyMs,
                  },
               );
               await trackAiCreditUsage(db, AI_EVENTS["ai.chat_message"], organizationId);
            } else {
               await emitAiCompletion(
                  { db, posthog, organizationId, userId },
                  {
                     model: "writerAgent",
                     provider: "openrouter",
                     promptTokens: 0,
                     completionTokens: 0,
                     totalTokens: 0,
                     latencyMs,
                     streamed: true,
                  },
               );
               await trackAiCreditUsage(db, AI_EVENTS["ai.completion"], organizationId);
            }
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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build FIM prompt from request
 */
function buildFIMPrompt(request: z.infer<typeof FIMRequestSchema>): string {
   const { prefix, suffix, cursorContext, editContext, recentText } = request;

   let prompt = `Continue this text naturally:\n\n${prefix}`;

   if (suffix) {
      prompt += `\n\n[Text after cursor]:\n${suffix}`;
   }

   if (cursorContext) {
      const contextHints: string[] = [];

      if (cursorContext.isEndOfSentence) {
         contextHints.push("cursor is at end of sentence");
      }
      if (cursorContext.isEndOfParagraph) {
         contextHints.push("cursor is at end of paragraph");
      }
      if (cursorContext.isAfterPunctuation) {
         contextHints.push("cursor follows punctuation");
      }

      if (contextHints.length > 0) {
         prompt += `\n\n[Context: ${contextHints.join(", ")}]`;
      }
   }

   if (editContext) {
      prompt += `\n\n[Intent: ${editContext.intent}]`;
   }

   if (recentText) {
      prompt += `\n\n[Recent edits]:\n${recentText}`;
   }

   return prompt;
}

/**
 * Build Edit prompt from request
 */
function buildEditPrompt(request: z.infer<typeof EditRequestSchema>): string {
   const { selectedText, instruction, contextBefore, contextAfter } = request;

   let prompt = "";

   if (contextBefore) {
      prompt += `CONTEXT BEFORE:\n${contextBefore}\n\n`;
   }

   prompt += `SELECTED TEXT:\n${selectedText}\n\nINSTRUCTION: ${instruction}`;

   if (contextAfter) {
      prompt += `\n\nCONTEXT AFTER:\n${contextAfter}`;
   }

   return prompt;
}
