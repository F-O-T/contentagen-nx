/**
 * PostHog LLM Analytics - Span Capture
 *
 * Captures $ai_span events for tool executions and other operations.
 * Spans are linked to parent generations via trace_id for debugging.
 */

import type { PostHog } from "posthog-node";

export interface CaptureAISpanParams {
   posthog: PostHog;
   distinctId: string;
   traceId: string;
   spanName: string;
   spanKind?: string;
   input?: Record<string, unknown>;
   output?: unknown;
   durationSeconds: number;
   isError?: boolean;
   errorMessage?: string;
}

/**
 * Capture an $ai_span event for PostHog LLM Analytics
 *
 * Use this to track tool executions within an agent's response.
 * Spans are grouped with their parent generation via traceId.
 *
 * @example
 * ```typescript
 * captureAISpan({
 *   posthog,
 *   distinctId: userId,
 *   traceId: parentTraceId,
 *   spanName: "webSearch",
 *   input: { query: "react hooks" },
 *   output: { results: [...] },
 *   durationSeconds: 1.2,
 * });
 * ```
 */
export function captureAISpan(params: CaptureAISpanParams): void {
   const {
      posthog,
      distinctId,
      traceId,
      spanName,
      spanKind = "tool_execution",
      input,
      output,
      durationSeconds,
      isError = false,
      errorMessage,
   } = params;

   posthog.capture({
      distinctId,
      event: "$ai_span",
      properties: {
         $ai_trace_id: traceId,
         $ai_span_name: spanName,
         $ai_span_kind: spanKind,
         $ai_span_input: input,
         $ai_span_output: output,
         $ai_span_duration: durationSeconds,
         $ai_span_error: isError ? errorMessage : undefined,
      },
   });
}
