import { z } from "zod";

// ---------------------------------------------------------------------------
// ai.completion
// ---------------------------------------------------------------------------

export const aiCompletionEventSchema = z.object({
   organizationId: z.string().uuid(),
   userId: z.string().uuid(),
   contentId: z.string().uuid().optional(),
   agentId: z.string().uuid().optional(),
   model: z.string(),
   provider: z.string(),
   promptTokens: z.number().int().nonnegative(),
   completionTokens: z.number().int().nonnegative(),
   totalTokens: z.number().int().nonnegative(),
   /** Latency in milliseconds */
   latencyMs: z.number().nonnegative(),
   /** Whether the completion was streamed */
   streamed: z.boolean().default(false),
   timestamp: z.string().datetime(),
});
export type AiCompletionEvent = z.infer<typeof aiCompletionEventSchema>;

// ---------------------------------------------------------------------------
// ai.chat_message
// ---------------------------------------------------------------------------

export const aiChatMessageEventSchema = z.object({
   organizationId: z.string().uuid(),
   userId: z.string().uuid(),
   chatId: z.string().uuid(),
   contentId: z.string().uuid().optional(),
   agentId: z.string().uuid().optional(),
   model: z.string(),
   provider: z.string(),
   role: z.enum(["user", "assistant"]),
   promptTokens: z.number().int().nonnegative(),
   completionTokens: z.number().int().nonnegative(),
   totalTokens: z.number().int().nonnegative(),
   /** Latency in milliseconds */
   latencyMs: z.number().nonnegative(),
   timestamp: z.string().datetime(),
});
export type AiChatMessageEvent = z.infer<typeof aiChatMessageEventSchema>;

// ---------------------------------------------------------------------------
// ai.agent_action
// ---------------------------------------------------------------------------

export const aiAgentActionEventSchema = z.object({
   organizationId: z.string().uuid(),
   userId: z.string().uuid(),
   agentId: z.string().uuid(),
   contentId: z.string().uuid().optional(),
   action: z.string(),
   model: z.string(),
   provider: z.string(),
   promptTokens: z.number().int().nonnegative(),
   completionTokens: z.number().int().nonnegative(),
   totalTokens: z.number().int().nonnegative(),
   /** Latency in milliseconds */
   latencyMs: z.number().nonnegative(),
   timestamp: z.string().datetime(),
});
export type AiAgentActionEvent = z.infer<typeof aiAgentActionEventSchema>;
