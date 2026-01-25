/**
 * Agent Streaming Utilities
 *
 * Handles processing of streaming chunks from Mastra agents.
 * Provides typed chunk processing and tool call handling.
 */
import type { AgentStreamChunk, ToolCall } from "../schemas";

/**
 * Callback types for stream processing
 */
export interface StreamCallbacks {
   onStepStart?: (stepIndex: number) => void;
   onText?: (text: string, stepIndex: number, done?: boolean) => void;
   onToolCallStart?: (toolCall: ToolCall, stepIndex: number) => void;
   onToolCallComplete?: (
      toolCallId: string,
      result: unknown,
      stepIndex: number,
   ) => void;
   onStepComplete?: (stepIndex: number) => void;
   onDone?: () => void;
   onError?: (error: string) => void;
}

/**
 * Process a single streaming chunk
 */
export function processStreamChunk(
   chunk: AgentStreamChunk,
   callbacks: StreamCallbacks,
): void {
   switch (chunk.type) {
      case "step_start":
         callbacks.onStepStart?.(chunk.stepIndex);
         break;

      case "text":
         callbacks.onText?.(chunk.text, chunk.stepIndex, chunk.done);
         break;

      case "tool_call_start":
         callbacks.onToolCallStart?.(chunk.toolCall, chunk.stepIndex);
         break;

      case "tool_call_complete":
         callbacks.onToolCallComplete?.(
            chunk.toolCallId,
            chunk.result,
            chunk.stepIndex,
         );
         break;

      case "step_complete":
         callbacks.onStepComplete?.(chunk.stepIndex);
         break;

      case "done":
         callbacks.onDone?.();
         break;

      case "error":
         callbacks.onError?.(chunk.error);
         break;
   }
}

/**
 * Stream processor that handles async iteration of chunks
 */
export async function processStream(
   stream: AsyncIterable<AgentStreamChunk>,
   callbacks: StreamCallbacks,
   abortSignal?: AbortSignal,
): Promise<void> {
   try {
      for await (const chunk of stream) {
         // Check for abort
         if (abortSignal?.aborted) {
            return;
         }

         processStreamChunk(chunk, callbacks);

         // If done, exit early
         if (chunk.type === "done" || chunk.type === "error") {
            return;
         }
      }
   } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
         return;
      }
      callbacks.onError?.(
         error instanceof Error ? error.message : "Stream processing failed",
      );
   }
}

/**
 * Text accumulator for collecting streamed text
 * Includes bounds to prevent unbounded memory growth
 */
export class TextAccumulator {
   private text = "";
   private stepTexts = new Map<number, string>();
   private readonly maxLength: number;
   private truncated = false;

   /**
    * Create a new TextAccumulator
    * @param maxLength - Maximum text length before truncation (default: 1MB)
    */
   constructor(maxLength = 1024 * 1024) {
      this.maxLength = maxLength;
   }

   /**
    * Append text to the accumulator
    * Truncates from the beginning if max length is exceeded
    */
   append(text: string, stepIndex?: number): void {
      this.text += text;

      // Truncate if exceeding max length
      if (this.text.length > this.maxLength) {
         const excess = this.text.length - this.maxLength;
         this.text = this.text.slice(excess);
         this.truncated = true;
      }

      if (stepIndex !== undefined) {
         const existing = this.stepTexts.get(stepIndex) ?? "";
         this.stepTexts.set(stepIndex, existing + text);
      }
   }

   /**
    * Get all accumulated text
    */
   getText(): string {
      return this.text;
   }

   /**
    * Get text for a specific step
    */
   getStepText(stepIndex: number): string {
      return this.stepTexts.get(stepIndex) ?? "";
   }

   /**
    * Check if text was truncated due to max length
    */
   wasTruncated(): boolean {
      return this.truncated;
   }

   /**
    * Get current length
    */
   getLength(): number {
      return this.text.length;
   }

   /**
    * Clear the accumulator
    */
   clear(): void {
      this.text = "";
      this.stepTexts.clear();
      this.truncated = false;
   }
}

/**
 * Tool call collector for aggregating tool calls
 */
export class ToolCallCollector {
   private pendingCalls = new Map<string, ToolCall>();
   private completedCalls = new Map<
      string,
      { toolCall: ToolCall; result: unknown }
   >();

   /**
    * Register a tool call start
    */
   startToolCall(toolCall: ToolCall): void {
      this.pendingCalls.set(toolCall.id, toolCall);
   }

   /**
    * Register a tool call completion
    */
   completeToolCall(toolCallId: string, result: unknown): void {
      const toolCall = this.pendingCalls.get(toolCallId);
      if (toolCall) {
         this.completedCalls.set(toolCallId, { toolCall, result });
         this.pendingCalls.delete(toolCallId);
      }
   }

   /**
    * Get all pending tool calls
    */
   getPendingCalls(): ToolCall[] {
      return Array.from(this.pendingCalls.values());
   }

   /**
    * Get all completed tool calls
    */
   getCompletedCalls(): Array<{ toolCall: ToolCall; result: unknown }> {
      return Array.from(this.completedCalls.values());
   }

   /**
    * Check if there are pending calls
    */
   hasPendingCalls(): boolean {
      return this.pendingCalls.size > 0;
   }

   /**
    * Clear all calls
    */
   clear(): void {
      this.pendingCalls.clear();
      this.completedCalls.clear();
   }
}

/**
 * Create a stream processor with text and tool call collection
 */
export function createStreamProcessor(callbacks?: Partial<StreamCallbacks>): {
   textAccumulator: TextAccumulator;
   toolCallCollector: ToolCallCollector;
   processChunk: (chunk: AgentStreamChunk) => void;
   process: (
      stream: AsyncIterable<AgentStreamChunk>,
      abortSignal?: AbortSignal,
   ) => Promise<void>;
} {
   const textAccumulator = new TextAccumulator();
   const toolCallCollector = new ToolCallCollector();

   const mergedCallbacks: StreamCallbacks = {
      ...callbacks,
      onText: (text, stepIndex, done) => {
         textAccumulator.append(text, stepIndex);
         callbacks?.onText?.(text, stepIndex, done);
      },
      onToolCallStart: (toolCall, stepIndex) => {
         toolCallCollector.startToolCall(toolCall);
         callbacks?.onToolCallStart?.(toolCall, stepIndex);
      },
      onToolCallComplete: (toolCallId, result, stepIndex) => {
         toolCallCollector.completeToolCall(toolCallId, result);
         callbacks?.onToolCallComplete?.(toolCallId, result, stepIndex);
      },
   };

   return {
      textAccumulator,
      toolCallCollector,
      processChunk: (chunk) => processStreamChunk(chunk, mergedCallbacks),
      process: (stream, abortSignal) =>
         processStream(stream, mergedCallbacks, abortSignal),
   };
}

/**
 * Handle stream errors consistently across the editor
 * Filters out AbortError and logs other errors with context
 *
 * @param error - The error to handle
 * @param context - Context string for logging (e.g., "FIM", "Edit", "Chat")
 * @returns true if the error was an AbortError (expected), false otherwise
 */
export function handleStreamError(error: unknown, context: string): boolean {
   if (error instanceof Error && error.name === "AbortError") {
      return true; // Expected cancellation, no action needed
   }

   // Log unexpected errors with context
   console.error(`[${context}] Stream error:`, error);
   return false;
}

/**
 * Check if an error is an AbortError
 */
export function isAbortError(error: unknown): boolean {
   return error instanceof Error && error.name === "AbortError";
}
