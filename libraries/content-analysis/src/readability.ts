/**
 * Readability Analysis Module
 * Analyzes content readability using Flesch-Kincaid algorithms
 */

import type {
   ReadabilityMetrics,
   ReadabilityResult,
   TargetAudience,
   TargetScore,
} from "./types";
import {
   calculateFleschKincaid,
   countSyllables,
   getReadabilityLevel,
} from "./utils";

const TARGET_SCORES: Record<TargetAudience, TargetScore> = {
   general: {
      min: 60,
      max: 70,
      description: "Easy to read for general audience",
   },
   technical: {
      min: 40,
      max: 60,
      description: "Technical but accessible",
   },
   academic: {
      min: 30,
      max: 50,
      description: "Academic/professional level",
   },
   casual: {
      min: 70,
      max: 80,
      description: "Very easy, conversational",
   },
};

/**
 * Analyze content readability
 */
export function analyzeReadability(
   content: string,
   targetAudience: TargetAudience = "general",
): ReadabilityResult {
   const { readingEase, gradeLevel } = calculateFleschKincaid(content);
   const readabilityLevel = getReadabilityLevel(readingEase);

   const targetScore = TARGET_SCORES[targetAudience];
   const isOnTarget =
      readingEase >= targetScore.min && readingEase <= targetScore.max;

   // Calculate metrics
   const cleanText = content.replace(/[^\w\s.!?]/g, "");
   const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
   const words = cleanText.split(/\s+/).filter(Boolean);

   const complexWords = words.filter((w: string) => countSyllables(w) >= 3);
   const totalSyllables = words.reduce(
      (sum: number, word: string) => sum + countSyllables(word),
      0,
   );

   // Generate suggestions
   const suggestions: string[] = [];

   if (readingEase < targetScore.min) {
      suggestions.push(
         "Simplify your language - use shorter words and sentences",
      );

      const avgWordsPerSentence = words.length / sentences.length;
      if (avgWordsPerSentence > 20) {
         suggestions.push(
            `Average sentence length is ${Math.round(avgWordsPerSentence)} words. Try to keep it under 20.`,
         );
      }

      if (complexWords.length / words.length > 0.2) {
         suggestions.push(
            "Too many complex words (3+ syllables). Replace with simpler alternatives.",
         );
      }

      suggestions.push("Break long sentences into shorter ones");
      suggestions.push("Use active voice instead of passive voice");
   } else if (readingEase > targetScore.max && targetAudience !== "casual") {
      suggestions.push("Content may be too simple for your target audience");
      suggestions.push("Consider adding more technical depth or detail");
   }

   if (sentences.some((s) => s.split(/\s+/).length > 40)) {
      suggestions.push(
         "Some sentences are very long. Consider breaking them up.",
      );
   }

   const metrics: ReadabilityMetrics = {
      sentenceCount: sentences.length,
      wordCount: words.length,
      avgWordsPerSentence:
         sentences.length > 0
            ? Math.round((words.length / sentences.length) * 10) / 10
            : 0,
      avgSyllablesPerWord:
         words.length > 0
            ? Math.round((totalSyllables / words.length) * 100) / 100
            : 0,
      complexWordCount: complexWords.length,
      complexWordPercentage:
         words.length > 0
            ? Math.round((complexWords.length / words.length) * 1000) / 10
            : 0,
   };

   return {
      fleschKincaidReadingEase: readingEase,
      fleschKincaidGradeLevel: gradeLevel,
      readabilityLevel,
      targetScore,
      isOnTarget,
      suggestions,
      metrics,
   };
}
