import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// AI Event Names
// ---------------------------------------------------------------------------

export const AI_EVENTS = {
   "ai.completion": "ai.completion",
   "ai.chat_message": "ai.chat_message",
   "ai.agent_action": "ai.agent_action",
} as const;

export type AiEventName = (typeof AI_EVENTS)[keyof typeof AI_EVENTS];

// ---------------------------------------------------------------------------
// ai.completion
// ---------------------------------------------------------------------------

export const aiCompletionEventSchema = z.object({
   contentId: z.uuid().optional(),
   agentId: z.uuid().optional(),
   model: z.string(),
   provider: z.string(),
   promptTokens: z.number().int().nonnegative(),
   completionTokens: z.number().int().nonnegative(),
   totalTokens: z.number().int().nonnegative(),
   latencyMs: z.number().nonnegative(),
   streamed: z.boolean().default(false),
});
export type AiCompletionEvent = z.infer<typeof aiCompletionEventSchema>;

export function emitAiCompletion(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: AiCompletionEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: AI_EVENTS["ai.completion"],
      eventCategory: EVENT_CATEGORIES.ai,
      properties,
   });
}

// ---------------------------------------------------------------------------
// ai.chat_message
// ---------------------------------------------------------------------------

export const aiChatMessageEventSchema = z.object({
   chatId: z.uuid(),
   contentId: z.uuid().optional(),
   agentId: z.uuid().optional(),
   model: z.string(),
   provider: z.string(),
   role: z.enum(["user", "assistant"]),
   promptTokens: z.number().int().nonnegative(),
   completionTokens: z.number().int().nonnegative(),
   totalTokens: z.number().int().nonnegative(),
   latencyMs: z.number().nonnegative(),
});
export type AiChatMessageEvent = z.infer<typeof aiChatMessageEventSchema>;

export function emitAiChatMessage(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: AiChatMessageEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: AI_EVENTS["ai.chat_message"],
      eventCategory: EVENT_CATEGORIES.ai,
      properties,
   });
}

// ---------------------------------------------------------------------------
// ai.agent_action
// ---------------------------------------------------------------------------

export const aiAgentActionEventSchema = z.object({
   agentId: z.uuid(),
   contentId: z.uuid().optional(),
   action: z.string(),
   model: z.string(),
   provider: z.string(),
   promptTokens: z.number().int().nonnegative(),
   completionTokens: z.number().int().nonnegative(),
   totalTokens: z.number().int().nonnegative(),
   latencyMs: z.number().nonnegative(),
});
export type AiAgentActionEvent = z.infer<typeof aiAgentActionEventSchema>;

export function emitAiAgentAction(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: AiAgentActionEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: AI_EVENTS["ai.agent_action"],
      eventCategory: EVENT_CATEGORIES.ai,
      properties,
   });
}
