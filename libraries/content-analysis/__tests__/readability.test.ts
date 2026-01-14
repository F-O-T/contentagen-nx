import { describe, expect, it } from "bun:test";
import { analyzeReadability } from "../src/readability";

describe("analyzeReadability", () => {
   it("should analyze simple text as easy to read", () => {
      const result = analyzeReadability(
         "The cat sat on the mat. It was a nice day. The sun was bright.",
         "general",
      );

      expect(result.fleschKincaidReadingEase).toBeGreaterThan(60);
      expect(result.metrics.avgWordsPerSentence).toBeLessThan(15);
   });

   it("should analyze complex text as difficult to read", () => {
      const result = analyzeReadability(
         "The implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding of computational paradigms and their multifaceted implications for system architecture.",
         "general",
      );

      expect(result.fleschKincaidReadingEase).toBeLessThan(40);
   });

   it("should generate suggestions for difficult text", () => {
      const result = analyzeReadability(
         "The implementation of sophisticated algorithmic methodologies necessitates comprehensive understanding.",
         "casual",
      );

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.isOnTarget).toBe(false);
   });

   it("should handle different audience targets", () => {
      const content = "This is a simple sentence. It is easy to read.";

      const generalResult = analyzeReadability(content, "general");
      const technicalResult = analyzeReadability(content, "technical");
      const academicResult = analyzeReadability(content, "academic");
      const casualResult = analyzeReadability(content, "casual");

      // Same content, different target scores
      expect(generalResult.targetScore.min).toBe(60);
      expect(technicalResult.targetScore.min).toBe(40);
      expect(academicResult.targetScore.min).toBe(30);
      expect(casualResult.targetScore.min).toBe(70);
   });

   it("should calculate metrics correctly", () => {
      const result = analyzeReadability(
         "One two three four five. Six seven eight nine ten.",
         "general",
      );

      expect(result.metrics.sentenceCount).toBe(2);
      expect(result.metrics.wordCount).toBe(10);
      expect(result.metrics.avgWordsPerSentence).toBe(5);
   });

   it("should handle empty content", () => {
      const result = analyzeReadability("", "general");

      expect(result.fleschKincaidReadingEase).toBe(0);
      expect(result.metrics.wordCount).toBe(0);
   });
});
