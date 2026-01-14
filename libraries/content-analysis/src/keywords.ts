/**
 * Keyword Analysis Module
 * Analyzes keyword usage, density, and placement in content
 */

import type {
   KeywordAnalysisItem,
   KeywordAnalysisResult,
   KeywordInput,
   KeywordMetrics,
   TopKeyword,
} from "./types";
import { extractWords } from "./utils";

/**
 * Analyze keyword usage in content
 */
export function analyzeKeywords(input: KeywordInput): KeywordAnalysisResult {
   const { content, title, targetKeywords } = input;
   const analysis: KeywordAnalysisItem[] = [];
   const recommendations: string[] = [];

   const words = extractWords(content);
   const totalWordCount = words.length;
   const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
   const contentLower = content.toLowerCase();
   const titleLower = title?.toLowerCase() || "";

   // Extract headings
   const headings = content.match(/^#{2,6}\s+(.+)$/gm) || [];
   const headingsText = headings.join(" ").toLowerCase();

   // First and last 100 words
   const first100Words = words.slice(0, 100).join(" ").toLowerCase();
   const last100Words = words.slice(-100).join(" ").toLowerCase();

   let totalDensity = 0;

   for (const keyword of targetKeywords) {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(keywordLower, "gi");
      const matches = contentLower.match(regex) || [];
      const count = matches.length;
      const density = totalWordCount > 0 ? (count / totalWordCount) * 100 : 0;
      totalDensity += density;

      // Determine locations
      const locations: KeywordAnalysisItem["locations"] = [];

      if (titleLower.includes(keywordLower)) {
         locations.push({ type: "title" });
      }
      if (headingsText.includes(keywordLower)) {
         locations.push({ type: "heading" });
      }
      if (first100Words.includes(keywordLower)) {
         locations.push({ type: "first100words" });
      }
      if (last100Words.includes(keywordLower)) {
         locations.push({ type: "last100words" });
      }

      // Determine status
      let status: KeywordAnalysisItem["status"];
      let suggestion: string | undefined;

      if (count === 0) {
         status = "missing";
         suggestion = `Add "${keyword}" naturally to your content`;
      } else if (density < 0.5) {
         status = "low";
         suggestion = `Consider using "${keyword}" a few more times`;
      } else if (density > 3) {
         status = "high";
         suggestion = `Reduce usage of "${keyword}" - it may appear spammy`;
      } else {
         status = "optimal";
      }

      analysis.push({
         keyword,
         count,
         density: Math.round(density * 100) / 100,
         locations,
         status,
         suggestion,
      });
   }

   // Calculate overall score
   let overallScore = 100;
   for (const item of analysis) {
      if (item.status === "missing") overallScore -= 15;
      else if (item.status === "low") overallScore -= 10;
      else if (item.status === "high") overallScore -= 5;
   }
   overallScore = Math.max(0, Math.min(100, overallScore));

   // Generate recommendations
   const missingKeywords = analysis.filter((a) => a.status === "missing");
   const lowKeywords = analysis.filter((a) => a.status === "low");
   const highKeywords = analysis.filter((a) => a.status === "high");

   if (missingKeywords.length > 0) {
      recommendations.push(
         `Add missing keywords: ${missingKeywords.map((k) => k.keyword).join(", ")}`,
      );
   }
   if (lowKeywords.length > 0) {
      recommendations.push(
         `Increase usage of: ${lowKeywords.map((k) => k.keyword).join(", ")}`,
      );
   }
   if (highKeywords.length > 0) {
      recommendations.push(
         `Reduce overused keywords: ${highKeywords.map((k) => k.keyword).join(", ")}`,
      );
   }

   // Top keywords (most used phrases in content)
   const phraseCount: Record<string, number> = {};
   const tokens = contentLower.match(/\b[a-záàâãéèêíïóôõöúç]{3,}\b/g) || [];
   for (const token of tokens) {
      phraseCount[token] = (phraseCount[token] || 0) + 1;
   }

   const topKeywords: TopKeyword[] = Object.entries(phraseCount)
      .filter(
         ([word]) =>
            word.length > 4 &&
            !["that", "this", "with", "from", "have", "been"].includes(word),
      )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({
         keyword,
         count,
         density: Math.round((count / totalWordCount) * 10000) / 100,
      }));

   const metrics: KeywordMetrics = {
      totalWordCount,
      uniqueWordCount: uniqueWords.size,
      avgKeywordDensity:
         targetKeywords.length > 0
            ? Math.round((totalDensity / targetKeywords.length) * 100) / 100
            : 0,
   };

   return {
      analysis,
      overallScore,
      topKeywords,
      recommendations,
      metrics,
   };
}
