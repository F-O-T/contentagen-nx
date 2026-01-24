/**
 * Streaming Module Tests
 */
import { describe, test, expect, beforeEach } from "bun:test";
import {
   TextAccumulator,
   ToolCallCollector,
   processStreamChunk,
   handleStreamError,
   isAbortError,
} from "../../../src/ai/streaming";
import type { AgentStreamChunk, ToolCall } from "../../../src/schemas";

describe("TextAccumulator", () => {
   let accumulator: TextAccumulator;

   beforeEach(() => {
      accumulator = new TextAccumulator();
   });

   test("should initialize with empty text", () => {
      expect(accumulator.getText()).toBe("");
      expect(accumulator.getLength()).toBe(0);
   });

   test("should append text correctly", () => {
      accumulator.append("Hello");
      accumulator.append(" world");
      expect(accumulator.getText()).toBe("Hello world");
   });

   test("should track step-specific text", () => {
      accumulator.append("Step 0 text", 0);
      accumulator.append("Step 1 text", 1);
      accumulator.append(" more", 0);
      expect(accumulator.getStepText(0)).toBe("Step 0 text more");
      expect(accumulator.getStepText(1)).toBe("Step 1 text");
      expect(accumulator.getText()).toBe("Step 0 textStep 1 text more");
   });

   test("should return empty string for unknown step", () => {
      expect(accumulator.getStepText(999)).toBe("");
   });

   test("should truncate when exceeding max length", () => {
      const smallAccumulator = new TextAccumulator(10);
      smallAccumulator.append("12345");
      smallAccumulator.append("67890ABC");
      // Total would be 13 chars, truncated to last 10
      expect(smallAccumulator.getLength()).toBe(10);
      expect(smallAccumulator.wasTruncated()).toBe(true);
      // After truncation, keeps the last 10 chars: "4567890ABC"
      expect(smallAccumulator.getText()).toBe("4567890ABC");
   });

   test("should not truncate when within max length", () => {
      const accumulator = new TextAccumulator(100);
      accumulator.append("Short text");
      expect(accumulator.wasTruncated()).toBe(false);
   });

   test("should clear all state", () => {
      accumulator.append("Some text", 0);
      accumulator.clear();
      expect(accumulator.getText()).toBe("");
      expect(accumulator.getStepText(0)).toBe("");
      expect(accumulator.getLength()).toBe(0);
   });
});

describe("ToolCallCollector", () => {
   let collector: ToolCallCollector;
   const mockToolCall: ToolCall = {
      id: "tool-1",
      name: "insertText",
      args: { text: "Hello" },
   };

   beforeEach(() => {
      collector = new ToolCallCollector();
   });

   test("should start with no pending calls", () => {
      expect(collector.hasPendingCalls()).toBe(false);
      expect(collector.getPendingCalls()).toEqual([]);
   });

   test("should track pending tool calls", () => {
      collector.startToolCall(mockToolCall);
      expect(collector.hasPendingCalls()).toBe(true);
      expect(collector.getPendingCalls()).toHaveLength(1);
      expect(collector.getPendingCalls()[0]).toEqual(mockToolCall);
   });

   test("should move tool call from pending to completed", () => {
      collector.startToolCall(mockToolCall);
      collector.completeToolCall("tool-1", { success: true });
      expect(collector.hasPendingCalls()).toBe(false);
      expect(collector.getCompletedCalls()).toHaveLength(1);
      expect(collector.getCompletedCalls()[0]).toEqual({
         toolCall: mockToolCall,
         result: { success: true },
      });
   });

   test("should handle completing non-existent tool call", () => {
      collector.completeToolCall("non-existent", { success: true });
      expect(collector.getCompletedCalls()).toHaveLength(0);
   });

   test("should clear all calls", () => {
      collector.startToolCall(mockToolCall);
      collector.completeToolCall("tool-1", { success: true });
      collector.clear();
      expect(collector.hasPendingCalls()).toBe(false);
      expect(collector.getCompletedCalls()).toHaveLength(0);
   });
});

describe("processStreamChunk", () => {
   test("should call onText for text chunks", () => {
      let receivedText = "";
      let receivedStepIndex = -1;
      const chunk: AgentStreamChunk = {
         type: "text",
         text: "Hello world",
         stepIndex: 0,
      };
      processStreamChunk(chunk, {
         onText: (text, stepIndex) => {
            receivedText = text;
            receivedStepIndex = stepIndex;
         },
      });
      expect(receivedText).toBe("Hello world");
      expect(receivedStepIndex).toBe(0);
   });

   test("should call onStepStart for step_start chunks", () => {
      let receivedStepIndex = -1;
      const chunk: AgentStreamChunk = {
         type: "step_start",
         stepIndex: 1,
      };
      processStreamChunk(chunk, {
         onStepStart: (stepIndex) => {
            receivedStepIndex = stepIndex;
         },
      });
      expect(receivedStepIndex).toBe(1);
   });

   test("should call onDone for done chunks", () => {
      let doneCalled = false;
      const chunk: AgentStreamChunk = {
         type: "done",
      };
      processStreamChunk(chunk, {
         onDone: () => {
            doneCalled = true;
         },
      });
      expect(doneCalled).toBe(true);
   });

   test("should call onError for error chunks", () => {
      let errorMessage = "";
      const chunk: AgentStreamChunk = {
         type: "error",
         error: "Something went wrong",
      };
      processStreamChunk(chunk, {
         onError: (error) => {
            errorMessage = error;
         },
      });
      expect(errorMessage).toBe("Something went wrong");
   });
});

describe("handleStreamError", () => {
   test("should return true for AbortError", () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      expect(handleStreamError(abortError, "Test")).toBe(true);
   });

   test("should return false for other errors", () => {
      const genericError = new Error("Something went wrong");
      expect(handleStreamError(genericError, "Test")).toBe(false);
   });

   test("should return false for non-Error objects", () => {
      expect(handleStreamError("string error", "Test")).toBe(false);
   });
});

describe("isAbortError", () => {
   test("should return true for AbortError", () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      expect(isAbortError(abortError)).toBe(true);
   });

   test("should return false for other errors", () => {
      expect(isAbortError(new Error("Other"))).toBe(false);
   });

   test("should return false for non-Error objects", () => {
      expect(isAbortError("not an error")).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
   });
});
