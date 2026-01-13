/**
 * LLM Analytics Event Types
 *
 * Type definitions for all LLM-related analytics events tracked in PostHog.
 * These events help understand AI feature usage and improve the system.
 */

/**
 * Common base properties for all LLM events
 */
export interface LLMBaseEvent {
   /** Content ID for correlating events across sessions */
   contentId?: string;
   /** Chat session ID */
   sessionId?: string;
   /** AI model used */
   model?: string;
   /** Number of input tokens consumed */
   inputTokens?: number;
   /** Number of output tokens generated */
   outputTokens?: number;
   /** Total tokens (input + output) */
   totalTokens?: number;
}

// ============================================================================
// FIM (Fill-In-Middle) Events
// ============================================================================

export type FIMTriggerType = "debounce" | "chain" | "punctuation" | "newline";
export type FIMArticleContext = "introduction" | "body" | "conclusion";
export type FIMStopReason = "natural" | "token_limit" | "stop_sequence";

/**
 * Confidence factors for FIM suggestions
 */
export interface FIMConfidenceFactors {
   /** 0-1 score based on completion length (optimal 20-150 chars) */
   length: number;
   /** 0-1 score for style match with prefix */
   prefixSimilarity: number;
   /** 0-1 score based on how completion ended */
   stopReason: number;
   /** 0-1 score based on response latency */
   latency: number;
   /** 0-1 score penalizing repetitive content */
   repetition: number;
}

/**
 * Server-side event: FIM completion generated
 * Captured after the model generates a suggestion
 */
export interface LLMFIMGeneratedEvent extends LLMBaseEvent {
   /** What triggered the FIM request */
   triggerType: FIMTriggerType;
   /** Where in the article the cursor is */
   articleContext: FIMArticleContext;
   /** Character length of text before cursor */
   prefixLength: number;
   /** Character length of text after cursor */
   suffixLength: number;
   /** Character length of the generated completion */
   completionLength: number;
   /** Time to generate in milliseconds */
   latencyMs: number;
   /** Overall confidence score (0-1) */
   confidence: number;
   /** Whether the suggestion should be shown */
   shouldShow: boolean;
   /** Individual confidence factor scores */
   factors: FIMConfidenceFactors;
   /** Why the completion stopped */
   stopReason: FIMStopReason;
}

export type FIMInteractionAction = "shown" | "accepted" | "rejected";

/**
 * Client-side event: User interaction with FIM suggestion
 * Captured when suggestion is shown, accepted, or rejected
 */
export interface LLMFIMInteractionEvent extends LLMBaseEvent {
   /** The interaction type */
   action: FIMInteractionAction;
   /** Time from shown to action in milliseconds */
   displayDurationMs?: number;
   /** Character length of the suggestion */
   completionLength: number;
}

// ============================================================================
// Chat Events
// ============================================================================

export type ChatMode = "plan" | "writer";

/**
 * Server-side event: Chat response completed
 * Captured when the agent finishes responding
 */
export interface LLMChatResponseEvent extends LLMBaseEvent {
   /** Agent mode (plan for research, writer for editing) */
   mode: ChatMode;
   /** Total streaming duration in milliseconds */
   durationMs: number;
   /** Number of reasoning steps taken */
   stepCount: number;
   /** List of tools used during response */
   toolsUsed: string[];
   /** Character length of the response */
   messageLength: number;
}

/**
 * Server-side event: Tool executed during chat
 * Captured for each tool call
 */
export interface LLMChatToolEvent extends LLMBaseEvent {
   /** Name of the tool executed */
   toolName: string;
   /** Execution duration in milliseconds */
   durationMs: number;
   /** Whether the tool succeeded */
   success: boolean;
   /** Error message if failed */
   errorMessage?: string;
}

/**
 * Client-side event: User sent a chat message
 */
export interface LLMChatMessageSentEvent extends LLMBaseEvent {
   /** Agent mode */
   mode: ChatMode;
   /** Character length of the message */
   messageLength: number;
   /** Whether text was selected in the editor */
   hasSelectionContext: boolean;
   /** Whether document context was included */
   hasDocumentContext?: boolean;
}

/**
 * Client-side event: Chat session started
 */
export interface LLMChatSessionStartedEvent {
   contentId: string;
   sessionId: string;
}

// ============================================================================
// Inline Edit Events
// ============================================================================

export type EditInstructionType =
   | "fix"
   | "improve"
   | "rewrite"
   | "shorten"
   | "expand"
   | "simplify"
   | "professional"
   | "casual"
   | "other";

/**
 * Server-side event: Inline edit generated
 * Captured when the edit model finishes
 */
export interface LLMEditGeneratedEvent extends LLMBaseEvent {
   /** Time to generate in milliseconds */
   latencyMs: number;
   /** Original text character length */
   originalLength: number;
   /** Edited text character length */
   newLength: number;
   /** Inferred type of edit instruction */
   instructionType: EditInstructionType;
}

export type EditInteractionAction = "requested" | "accepted" | "rejected";

/**
 * Client-side event: User interaction with inline edit
 */
export interface LLMEditInteractionEvent extends LLMBaseEvent {
   /** The interaction type */
   action: EditInteractionAction;
   /** Character length of the instruction */
   instructionLength: number;
   /** Character length of selected text */
   selectedTextLength: number;
}

// ============================================================================
// Plan Events
// ============================================================================

/**
 * Server-side event: Content plan created
 * Captured when the plan agent generates a plan
 */
export interface LLMPlanCreatedEvent extends LLMBaseEvent {
   /** Number of steps in the plan */
   stepCount: number;
   /** Research tools used during planning */
   researchToolsUsed: string[];
   /** Whether research insights were included */
   hasResearchInsights: boolean;
}

export type PlanExecutionAction =
   | "step_started"
   | "step_completed"
   | "plan_completed"
   | "plan_abandoned";

/**
 * Client-side event: Plan execution progress
 */
export interface LLMPlanExecutionEvent extends LLMBaseEvent {
   /** The execution action */
   action: PlanExecutionAction;
   /** Current step index (0-based) */
   stepIndex?: number;
   /** Total steps in the plan */
   totalSteps: number;
   /** Number of completed steps */
   completedSteps: number;
   /** Step execution duration in milliseconds */
   durationMs?: number;
}
