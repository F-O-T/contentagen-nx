/**
 * Editor streaming chunk types shared between oRPC router procedures
 * and client-side editor plugins.
 */

/**
 * FIMChunk — yielded by the `copilotStream` oRPC procedure.
 * Used by CopilotPlugin to accumulate ghost-text completions.
 */
export type FIMChunk =
   | { done: false; text: string; metadata?: never }
   | {
        done: true;
        text: string;
        metadata?: {
           stopReason: string;
           latencyMs: number;
        };
     };

/**
 * ChatChunk — yielded by the `aiCommandStream` oRPC procedure.
 * Carries text deltas, tool-call lifecycle events, step boundaries,
 * completion signals, and errors.
 */
export type ChatChunk =
   | { type: "text"; text: string }
   | {
        type: "tool_call_start";
        toolCall: {
           id: string;
           name: string;
           args: Record<string, unknown>;
        };
     }
   | {
        type: "tool_call_complete";
        toolCallId: string;
        toolName: string;
        result: unknown;
     }
   | { type: "step_start"; stepIndex: number }
   | { type: "step_complete"; stepIndex: number }
   | { type: "done" }
   | { type: "error"; error: string };
