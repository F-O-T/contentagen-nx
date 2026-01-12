/**
 * Client-side LLM Analytics Capture Functions
 *
 * These functions capture LLM-related user interactions on the client side.
 * The PostHog client automatically respects user consent settings.
 */

import { captureClientEvent } from "../client";
import type {
   LLMChatMessageSentEvent,
   LLMChatSessionStartedEvent,
   LLMEditInteractionEvent,
   LLMFIMInteractionEvent,
   LLMPlanExecutionEvent,
} from "./types";

// ============================================================================
// FIM Interactions
// ============================================================================

/**
 * Capture when a FIM suggestion is shown to the user
 */
export function captureFIMShown(event: Omit<LLMFIMInteractionEvent, "action">) {
   captureClientEvent("llm_fim_shown", {
      ...event,
      action: "shown",
   });
}

/**
 * Capture when the user accepts a FIM suggestion (Tab or click)
 */
export function captureFIMAccepted(
   event: Omit<LLMFIMInteractionEvent, "action">,
) {
   captureClientEvent("llm_fim_accepted", {
      ...event,
      action: "accepted",
   });
}

/**
 * Capture when the user rejects a FIM suggestion (Escape or typing)
 */
export function captureFIMRejected(
   event: Omit<LLMFIMInteractionEvent, "action">,
) {
   captureClientEvent("llm_fim_rejected", {
      ...event,
      action: "rejected",
   });
}

// ============================================================================
// Chat Interactions
// ============================================================================

/**
 * Capture when the user sends a chat message
 */
export function captureChatMessageSent(event: LLMChatMessageSentEvent) {
   captureClientEvent("llm_chat_message_sent", { ...event });
}

/**
 * Capture when a new chat session is started
 */
export function captureChatSessionStarted(event: LLMChatSessionStartedEvent) {
   captureClientEvent("llm_chat_session_started", { ...event });
}

// ============================================================================
// Inline Edit Interactions
// ============================================================================

/**
 * Capture when the user requests an inline edit
 */
export function captureEditRequested(
   event: Omit<LLMEditInteractionEvent, "action">,
) {
   captureClientEvent("llm_edit_requested", {
      ...event,
      action: "requested",
   });
}

/**
 * Capture when the user accepts an inline edit
 */
export function captureEditAccepted(
   event: Omit<LLMEditInteractionEvent, "action">,
) {
   captureClientEvent("llm_edit_accepted", {
      ...event,
      action: "accepted",
   });
}

/**
 * Capture when the user rejects an inline edit
 */
export function captureEditRejected(
   event: Omit<LLMEditInteractionEvent, "action">,
) {
   captureClientEvent("llm_edit_rejected", {
      ...event,
      action: "rejected",
   });
}

// ============================================================================
// Plan Execution
// ============================================================================

/**
 * Capture when the user starts a plan step
 */
export function capturePlanStepStarted(
   event: Omit<LLMPlanExecutionEvent, "action">,
) {
   captureClientEvent("llm_plan_step_started", {
      ...event,
      action: "step_started",
   });
}

/**
 * Capture when a plan step is completed
 */
export function capturePlanStepCompleted(
   event: Omit<LLMPlanExecutionEvent, "action">,
) {
   captureClientEvent("llm_plan_step_completed", {
      ...event,
      action: "step_completed",
   });
}

/**
 * Capture when a plan is fully completed
 */
export function capturePlanCompleted(
   event: Omit<LLMPlanExecutionEvent, "action">,
) {
   captureClientEvent("llm_plan_completed", {
      ...event,
      action: "plan_completed",
   });
}

/**
 * Capture when a plan is abandoned
 */
export function capturePlanAbandoned(
   event: Omit<LLMPlanExecutionEvent, "action">,
) {
   captureClientEvent("llm_plan_abandoned", {
      ...event,
      action: "plan_abandoned",
   });
}
