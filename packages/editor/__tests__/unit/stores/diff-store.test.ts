/**
 * Diff Store Tests
 */
import { describe, test, expect, beforeEach } from "bun:test";
import {
   showDiff,
   updateDiffModified,
   hideDiff,
   toggleDiff,
   clearDiff,
   getDiffState,
   countAdditions,
   countRemovals,
   hasChanges,
} from "../../../src/stores/diff-store";

describe("Diff Store", () => {
   beforeEach(() => {
      clearDiff();
   });

   test("should initialize with hidden state", () => {
      const state = getDiffState();
      expect(state.isVisible).toBe(false);
      expect(state.original).toBe("");
      expect(state.modified).toBe("");
      expect(state.lines).toEqual([]);
   });

   test("should show diff and calculate lines", () => {
      showDiff("original text", "modified text");
      const state = getDiffState();
      expect(state.isVisible).toBe(true);
      expect(state.original).toBe("original text");
      expect(state.modified).toBe("modified text");
      expect(state.lines.length).toBeGreaterThan(0);
   });

   test("should detect unchanged lines", () => {
      showDiff("same line", "same line");
      const state = getDiffState();
      expect(state.lines).toHaveLength(1);
      expect(state.lines[0]?.type).toBe("unchanged");
      expect(state.lines[0]?.content).toBe("same line");
   });

   test("should detect added lines", () => {
      showDiff("", "new line");
      const state = getDiffState();
      // Empty string produces one line, "new line" produces one line
      // Diff shows: removed empty + added "new line"
      expect(state.lines.length).toBeGreaterThan(0);
      const addedLines = state.lines.filter((l) => l.type === "added");
      expect(addedLines.length).toBeGreaterThan(0);
      expect(addedLines[0]?.content).toBe("new line");
   });

   test("should detect removed lines", () => {
      showDiff("old line", "");
      const state = getDiffState();
      // "old line" produces one line, empty produces one line
      // Diff shows: removed "old line" + added empty
      expect(state.lines.length).toBeGreaterThan(0);
      const removedLines = state.lines.filter((l) => l.type === "removed");
      expect(removedLines.length).toBeGreaterThan(0);
      expect(removedLines[0]?.content).toBe("old line");
   });

   test("should handle multiline diffs", () => {
      showDiff("line1\nline2\nline3", "line1\nmodified\nline3");
      const state = getDiffState();
      expect(state.lines.length).toBeGreaterThan(0);
      // line1 unchanged, line2 removed + modified added, line3 unchanged
   });

   test("should update modified content and recalculate diff", () => {
      showDiff("original", "");
      updateDiffModified("new content");
      const state = getDiffState();
      expect(state.modified).toBe("new content");
   });

   test("should hide diff", () => {
      showDiff("original", "modified");
      hideDiff();
      const state = getDiffState();
      expect(state.isVisible).toBe(false);
   });

   test("should toggle diff visibility", () => {
      showDiff("original", "modified");
      expect(getDiffState().isVisible).toBe(true);
      toggleDiff();
      expect(getDiffState().isVisible).toBe(false);
      toggleDiff();
      expect(getDiffState().isVisible).toBe(true);
   });
});

describe("Diff Utility Functions", () => {
   test("countAdditions should count added lines", () => {
      const lines = [
         { type: "added" as const, content: "line1", lineNumber: 1 },
         { type: "unchanged" as const, content: "line2", lineNumber: 2 },
         { type: "added" as const, content: "line3", lineNumber: 3 },
      ];
      expect(countAdditions(lines)).toBe(2);
   });

   test("countRemovals should count removed lines", () => {
      const lines = [
         { type: "removed" as const, content: "line1" },
         { type: "unchanged" as const, content: "line2", lineNumber: 1 },
         { type: "removed" as const, content: "line3" },
      ];
      expect(countRemovals(lines)).toBe(2);
   });

   test("hasChanges should return true when there are changes", () => {
      const withChanges = [
         { type: "unchanged" as const, content: "line1", lineNumber: 1 },
         { type: "added" as const, content: "line2", lineNumber: 2 },
      ];
      expect(hasChanges(withChanges)).toBe(true);
   });

   test("hasChanges should return false when no changes", () => {
      const noChanges = [
         { type: "unchanged" as const, content: "line1", lineNumber: 1 },
         { type: "unchanged" as const, content: "line2", lineNumber: 2 },
      ];
      expect(hasChanges(noChanges)).toBe(false);
   });

   test("hasChanges should return false for empty array", () => {
      expect(hasChanges([])).toBe(false);
   });
});
