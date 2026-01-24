/**
 * FIM Store Tests
 */
import { describe, test, expect, beforeEach } from "bun:test";
import {
   setGhostText,
   appendGhostText,
   clearFIM,
   startFIMSession,
   completeFIMSession,
   incrementChainDepth,
   resetChain,
   setConfidence,
   getFIMState,
} from "../../../src/stores/fim-store";

describe("FIM Store", () => {
   beforeEach(() => {
      clearFIM();
   });

   test("should initialize with idle state", () => {
      const state = getFIMState();
      expect(state.mode).toBe("idle");
      expect(state.ghostText).toBe("");
      expect(state.isVisible).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.completionId).toBeNull();
   });

   test("should set ghost text and update visibility", () => {
      setGhostText("Hello world");
      const state = getFIMState();
      expect(state.ghostText).toBe("Hello world");
      expect(state.isVisible).toBe(true);
   });

   test("should clear ghost text visibility when empty", () => {
      setGhostText("Hello world");
      setGhostText("");
      const state = getFIMState();
      expect(state.ghostText).toBe("");
      expect(state.isVisible).toBe(false);
   });

   test("should append ghost text incrementally", () => {
      setGhostText("Hello");
      appendGhostText(" world");
      const state = getFIMState();
      expect(state.ghostText).toBe("Hello world");
      expect(state.isVisible).toBe(true);
   });

   test("should start session with correct completionId", () => {
      startFIMSession("test-completion-123", "debounce", false);
      const state = getFIMState();
      expect(state.completionId).toBe("test-completion-123");
      expect(state.triggerType).toBe("debounce");
      expect(state.isManualTrigger).toBe(false);
      expect(state.isLoading).toBe(true);
   });

   test("should complete session and stop loading", () => {
      startFIMSession("test-completion-123", "debounce");
      completeFIMSession();
      const state = getFIMState();
      expect(state.isLoading).toBe(false);
   });

   test("should clear state on cancel", () => {
      startFIMSession("test-completion-123", "debounce");
      setGhostText("Some text");
      clearFIM();
      const state = getFIMState();
      expect(state.ghostText).toBe("");
      expect(state.isVisible).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.completionId).toBeNull();
   });

   test("should track chain depth correctly", () => {
      expect(getFIMState().chainDepth).toBe(0);
      incrementChainDepth(10);
      expect(getFIMState().chainDepth).toBe(1);
      expect(getFIMState().lastAcceptPosition).toBe(10);
      incrementChainDepth(20);
      expect(getFIMState().chainDepth).toBe(2);
   });

   test("should reset chain state", () => {
      incrementChainDepth(10);
      incrementChainDepth(20);
      resetChain();
      const state = getFIMState();
      expect(state.chainDepth).toBe(0);
      expect(state.lastAcceptPosition).toBeNull();
   });

   test("should set confidence factors", () => {
      const factors = {
         length: 0.8,
         prefixSimilarity: 0.9,
         stopReason: 1.0,
         latency: 0.7,
         repetition: 0.85,
      };
      setConfidence(0.85, factors, true);
      const state = getFIMState();
      expect(state.confidenceScore).toBe(0.85);
      expect(state.confidenceFactors).toEqual(factors);
      expect(state.shouldShow).toBe(true);
   });
});
