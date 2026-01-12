/**
 * Server-side LLM Analytics Capture Functions
 *
 * These functions capture LLM-related events on the server side,
 * respecting user consent and including organization context.
 */

import type { PostHog } from "posthog-node";
import { captureServerEvent } from "../server";
import type {
   LLMChatResponseEvent,
   LLMChatToolEvent,
   LLMEditGeneratedEvent,
   LLMFIMGeneratedEvent,
   LLMPlanCreatedEvent,
} from "./types";

/**
 * Context required for capturing LLM events
 */
export interface LLMCaptureContext {
   /** PostHog instance */
   posthog: PostHog;
   /** User ID for attribution */
   userId: string;
   /** Organization ID for group analytics */
   organizationId?: string;
   /** Whether user has consented to telemetry */
   hasConsent: boolean;
}

// ============================================================================
// FIM Events
// ============================================================================

/**
 * Capture FIM generation event
 * Call after the FIM agent generates a completion
 */
export function captureFIMGenerated(
   ctx: LLMCaptureContext,
   event: LLMFIMGeneratedEvent,
) {
   if (!ctx.hasConsent) return;

   captureServerEvent(ctx.posthog, {
      userId: ctx.userId,
      event: "llm_fim_generated",
      properties: {
         ...event,
      },
      groups: ctx.organizationId
         ? { organization: ctx.organizationId }
         : undefined,
   });
}

// ============================================================================
// Chat Events
// ============================================================================

/**
 * Capture chat response completion event
 * Call when the agent finishes streaming a response
 */
export function captureChatResponseComplete(
   ctx: LLMCaptureContext,
   event: LLMChatResponseEvent,
) {
   if (!ctx.hasConsent) return;

   captureServerEvent(ctx.posthog, {
      userId: ctx.userId,
      event: "llm_chat_response_complete",
      properties: {
         ...event,
      },
      groups: ctx.organizationId
         ? { organization: ctx.organizationId }
         : undefined,
   });
}

/**
 * Capture tool execution event
 * Call for each tool used during a chat response
 */
export function captureChatToolExecuted(
   ctx: LLMCaptureContext,
   event: LLMChatToolEvent,
) {
   if (!ctx.hasConsent) return;

   captureServerEvent(ctx.posthog, {
      userId: ctx.userId,
      event: "llm_chat_tool_executed",
      properties: {
         ...event,
      },
      groups: ctx.organizationId
         ? { organization: ctx.organizationId }
         : undefined,
   });
}

// ============================================================================
// Edit Events
// ============================================================================

/**
 * Capture inline edit generation event
 * Call when the edit agent finishes generating
 */
export function captureEditGenerated(
   ctx: LLMCaptureContext,
   event: LLMEditGeneratedEvent,
) {
   if (!ctx.hasConsent) return;

   captureServerEvent(ctx.posthog, {
      userId: ctx.userId,
      event: "llm_edit_generated",
      properties: {
         ...event,
      },
      groups: ctx.organizationId
         ? { organization: ctx.organizationId }
         : undefined,
   });
}

// ============================================================================
// Plan Events
// ============================================================================

/**
 * Capture plan creation event
 * Call when the plan agent creates a content plan
 */
export function capturePlanCreated(
   ctx: LLMCaptureContext,
   event: LLMPlanCreatedEvent,
) {
   if (!ctx.hasConsent) return;

   captureServerEvent(ctx.posthog, {
      userId: ctx.userId,
      event: "llm_plan_created",
      properties: {
         ...event,
      },
      groups: ctx.organizationId
         ? { organization: ctx.organizationId }
         : undefined,
   });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Infer the instruction type from an edit instruction string
 */
export function inferInstructionType(
   instruction: string,
):
   | "fix"
   | "improve"
   | "rewrite"
   | "shorten"
   | "expand"
   | "simplify"
   | "professional"
   | "casual"
   | "other" {
   const lower = instruction.toLowerCase();

   if (lower.includes("fix") || lower.includes("correct")) return "fix";
   if (lower.includes("improve") || lower.includes("enhance")) return "improve";
   if (lower.includes("rewrite") || lower.includes("rephrase"))
      return "rewrite";
   if (lower.includes("shorten") || lower.includes("summarize"))
      return "shorten";
   if (lower.includes("expand") || lower.includes("elaborate")) return "expand";
   if (lower.includes("simplify") || lower.includes("simpler"))
      return "simplify";
   if (lower.includes("professional") || lower.includes("formal"))
      return "professional";
   if (lower.includes("casual") || lower.includes("informal")) return "casual";

   return "other";
}
