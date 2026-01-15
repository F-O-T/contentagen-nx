/**
 * PostHog LLM Analytics - Generation Capture
 *
 * Captures $ai_generation events for developer debugging in production.
 * These events power PostHog's LLM Analytics dashboard with full prompt/completion data.
 *
 * Note: This is separate from the user-facing analytics (llm_* custom events).
 */

import { randomUUID } from "crypto";
import type { PostHog } from "posthog-node";

export interface AIGenerationInput {
   role: string;
   content: string | Array<{ type: string; text: string }>;
}

export interface AIGenerationOutput {
   role: string;
   content: string;
}

export interface CaptureAIGenerationParams {
   posthog: PostHog;
   distinctId: string;
   traceId?: string;
   model: string;
   provider?: string;
   input: AIGenerationInput[];
   outputChoices: AIGenerationOutput[];
   inputTokens: number;
   outputTokens: number;
   latencySeconds: number;
   httpStatus?: number;
   isError?: boolean;
   // Custom properties for filtering/debugging
   contentId?: string;
   sessionId?: string;
   agentId?: string;
   mode?: "plan" | "writer" | "fim" | "edit" | "spelling";
   // Additional custom properties
   [key: string]: unknown;
}

/**
 * Generate a unique trace ID for grouping related LLM events
 */
export function generateTraceId(): string {
   return randomUUID();
}

/**
 * Capture an $ai_generation event for PostHog LLM Analytics
 *
 * @example
 * ```typescript
 * captureAIGeneration({
 *   posthog,
 *   distinctId: userId,
 *   traceId: generateTraceId(),
 *   model: "openrouter/minimax/minimax-m2.1",
 *   input: [{ role: "user", content: "Hello" }],
 *   outputChoices: [{ role: "assistant", content: "Hi there!" }],
 *   inputTokens: 10,
 *   outputTokens: 5,
 *   latencySeconds: 0.5,
 *   mode: "plan",
 * });
 * ```
 */
export function captureAIGeneration(params: CaptureAIGenerationParams): void {
   const {
      posthog,
      distinctId,
      traceId,
      model,
      provider = "openrouter",
      input,
      outputChoices,
      inputTokens,
      outputTokens,
      latencySeconds,
      httpStatus = 200,
      isError = false,
      contentId,
      sessionId,
      agentId,
      mode,
      ...customProperties
   } = params;

   posthog.capture({
      distinctId,
      event: "$ai_generation",
      properties: {
         // PostHog LLM Analytics standard properties
         $ai_trace_id: traceId ?? generateTraceId(),
         $ai_model: model,
         $ai_provider: provider,
         $ai_input: input,
         $ai_output_choices: outputChoices,
         $ai_input_tokens: inputTokens,
         $ai_output_tokens: outputTokens,
         $ai_latency: latencySeconds,
         $ai_http_status: httpStatus,
         $ai_is_error: isError,
         // Custom properties for filtering/debugging
         contentId,
         sessionId,
         agentId,
         mode,
         ...customProperties,
      },
   });
}
