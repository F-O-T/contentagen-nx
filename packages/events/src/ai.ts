import {
   createMoney,
   type Money,
   parseDecimalToMinorUnits,
} from "@f-o-t/money";
import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

// ---------------------------------------------------------------------------
// AI Pricing
// ---------------------------------------------------------------------------

export const AI_PRICING: Record<string, string> = {
   "ai.completion": "0.003000",
   "ai.chat_message": "0.020000",
   "ai.agent_action": "0.040000",
   // ai.image_generation price is model-dependent — see IMAGE_MODEL_PRICING
};

// ---------------------------------------------------------------------------
// Image Generation Pricing
// ---------------------------------------------------------------------------

const PRICE_SCALE = 6;
const CURRENCY = "BRL";

export const IMAGE_MODEL_PRICING: Record<string, string> = {
   // Sourceful Riverflow
   "sourceful/riverflow-v2-pro": "0.900000",
   "sourceful/riverflow-v2-fast": "0.120000",
   // ByteDance
   "bytedance-seed/seedream-4.5": "0.240000",
   // Black Forest Labs FLUX.2
   "black-forest-labs/flux.2-klein-4b": "0.083000",
   "black-forest-labs/flux.2-pro": "0.177000",
   "black-forest-labs/flux.2-flex": "0.354000",
   "black-forest-labs/flux.2-max": "0.413000",
   // Google Gemini image models
   "google/gemini-2.5-flash-image": "0.236000",
   "google/gemini-3-pro-image-preview": "0.708000",
   // OpenAI
   "openai/gpt-5-image": "0.236000",
};

export function getImageGenerationPrice(model: string): Money {
   const amount =
      IMAGE_MODEL_PRICING[model] ??
      IMAGE_MODEL_PRICING["sourceful/riverflow-v2-pro"] ??
      "0.900000";
   return createMoney(
      parseDecimalToMinorUnits(amount, PRICE_SCALE),
      CURRENCY,
      PRICE_SCALE,
   );
}

/**
 * Returns the price of an image generation model as an integer in minor units
 * (i.e. scaled by 10^PRICE_SCALE). Use this for numeric comparisons to avoid
 * floating-point precision issues.
 */
export function getImageGenerationPriceMinorUnits(model: string): number {
   const amount =
      IMAGE_MODEL_PRICING[model] ??
      IMAGE_MODEL_PRICING["sourceful/riverflow-v2-pro"] ??
      "0.900000";
   return Number(parseDecimalToMinorUnits(amount, PRICE_SCALE));
}

// ---------------------------------------------------------------------------
// AI Event Names
// ---------------------------------------------------------------------------

export const AI_EVENTS = {
   "ai.completion": "ai.completion",
   "ai.chat_message": "ai.chat_message",
   "ai.agent_action": "ai.agent_action",
   "ai.image_generation": "ai.image_generation",
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: AiCompletionEvent,
) {
   return emit({
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: AiChatMessageEvent,
) {
   return emit({
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
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: AiAgentActionEvent,
) {
   return emit({
      ...ctx,
      eventName: AI_EVENTS["ai.agent_action"],
      eventCategory: EVENT_CATEGORIES.ai,
      properties,
   });
}

// ---------------------------------------------------------------------------
// ai.image_generation
// ---------------------------------------------------------------------------

export const aiImageGenerationEventSchema = z.object({
   assetId: z.string().uuid(),
   prompt: z.string(),
   model: z.string(),
   latencyMs: z.number().nonnegative(),
   fileSizeBytes: z.number().int().nonnegative(),
   mimeType: z.string(),
});
export type AiImageGenerationEvent = z.infer<
   typeof aiImageGenerationEventSchema
>;

export function emitAiImageGeneration(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: AiImageGenerationEvent,
) {
   return emit({
      ...ctx,
      eventName: AI_EVENTS["ai.image_generation"],
      eventCategory: EVENT_CATEGORIES.ai,
      properties,
      priceOverride: getImageGenerationPrice(properties.model),
   });
}
