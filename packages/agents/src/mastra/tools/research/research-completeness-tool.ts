import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const SCORING_CRITERIA = {
   serpAnalysis: { points: 20, description: "SERP analysis completed" },
   competitorAnalysis: {
      points: 20,
      description: "2+ competitor analyses completed",
   },
   relatedKeywords: { points: 15, description: "Related keywords explored" },
   contentGaps: { points: 15, description: "Content gaps identified" },
   factsGathered: { points: 15, description: "Facts/statistics gathered" },
   deepCrawl: {
      points: 15,
      description: "At least 1 deep crawl for detailed content",
   },
} as const;

const MINIMUM_SCORE = 70;

export const researchCompletenessTool = createTool({
   id: "research-completeness",
   description:
      "Checks if research is comprehensive enough to create a quality plan. MUST be called before createPlan. Returns a score and identifies missing research areas.",
   inputSchema: z.object({
      completedResearch: z.object({
         serpAnalysis: z
            .boolean()
            .describe("Whether serpAnalysis tool was called"),
         competitorCount: z
            .number()
            .describe("Number of competitor analyses completed"),
         relatedKeywordsSearched: z
            .boolean()
            .describe("Whether relatedKeywords tool was called"),
         contentGapsAnalyzed: z
            .boolean()
            .describe("Whether contentGapFinder tool was called"),
         factsGathered: z
            .number()
            .describe("Number of facts gathered from factFinder"),
         deepCrawlCount: z.number().describe("Number of webCrawl calls made"),
      }),
      topicComplexity: z
         .enum(["simple", "moderate", "complex"])
         .optional()
         .default("moderate")
         .describe("Complexity of the topic being researched"),
   }),
   outputSchema: z.object({
      score: z.number().describe("Research completeness score (0-100)"),
      canProceed: z.boolean().describe("Whether score meets minimum threshold"),
      minimumScore: z.number().describe("Minimum score required to proceed"),
      breakdown: z.array(
         z.object({
            criterion: z.string(),
            points: z.number(),
            earned: z.number(),
            status: z.enum(["complete", "partial", "missing"]),
            suggestion: z.string().optional(),
         }),
      ),
      missing: z.array(z.string()).describe("Research areas that are missing"),
      recommendations: z
         .array(z.string())
         .describe("Suggestions for improving research"),
      qualityLevel: z.enum([
         "insufficient",
         "basic",
         "good",
         "excellent",
         "comprehensive",
      ]),
   }),
   execute: async (inputData) => {
      const { completedResearch, topicComplexity } = inputData;

      const breakdown: Array<{
         criterion: string;
         points: number;
         earned: number;
         status: "complete" | "partial" | "missing";
         suggestion?: string;
      }> = [];

      let totalScore = 0;

      // SERP Analysis
      if (completedResearch.serpAnalysis) {
         breakdown.push({
            criterion: SCORING_CRITERIA.serpAnalysis.description,
            points: SCORING_CRITERIA.serpAnalysis.points,
            earned: SCORING_CRITERIA.serpAnalysis.points,
            status: "complete",
         });
         totalScore += SCORING_CRITERIA.serpAnalysis.points;
      } else {
         breakdown.push({
            criterion: SCORING_CRITERIA.serpAnalysis.description,
            points: SCORING_CRITERIA.serpAnalysis.points,
            earned: 0,
            status: "missing",
            suggestion:
               "Call serpAnalysis to understand what content ranks well",
         });
      }

      // Competitor Analysis
      const competitorPoints = SCORING_CRITERIA.competitorAnalysis.points;
      if (completedResearch.competitorCount >= 2) {
         breakdown.push({
            criterion: SCORING_CRITERIA.competitorAnalysis.description,
            points: competitorPoints,
            earned: competitorPoints,
            status: "complete",
         });
         totalScore += competitorPoints;
      } else if (completedResearch.competitorCount === 1) {
         breakdown.push({
            criterion: SCORING_CRITERIA.competitorAnalysis.description,
            points: competitorPoints,
            earned: Math.round(competitorPoints / 2),
            status: "partial",
            suggestion:
               "Analyze at least one more competitor for better insights",
         });
         totalScore += Math.round(competitorPoints / 2);
      } else {
         breakdown.push({
            criterion: SCORING_CRITERIA.competitorAnalysis.description,
            points: competitorPoints,
            earned: 0,
            status: "missing",
            suggestion:
               "Use competitorContent to analyze top-ranking articles from SERP results",
         });
      }

      // Related Keywords
      if (completedResearch.relatedKeywordsSearched) {
         breakdown.push({
            criterion: SCORING_CRITERIA.relatedKeywords.description,
            points: SCORING_CRITERIA.relatedKeywords.points,
            earned: SCORING_CRITERIA.relatedKeywords.points,
            status: "complete",
         });
         totalScore += SCORING_CRITERIA.relatedKeywords.points;
      } else {
         breakdown.push({
            criterion: SCORING_CRITERIA.relatedKeywords.description,
            points: SCORING_CRITERIA.relatedKeywords.points,
            earned: 0,
            status: "missing",
            suggestion:
               "Call relatedKeywords to discover keyword variations and questions",
         });
      }

      // Content Gaps
      if (completedResearch.contentGapsAnalyzed) {
         breakdown.push({
            criterion: SCORING_CRITERIA.contentGaps.description,
            points: SCORING_CRITERIA.contentGaps.points,
            earned: SCORING_CRITERIA.contentGaps.points,
            status: "complete",
         });
         totalScore += SCORING_CRITERIA.contentGaps.points;
      } else {
         breakdown.push({
            criterion: SCORING_CRITERIA.contentGaps.description,
            points: SCORING_CRITERIA.contentGaps.points,
            earned: 0,
            status: "missing",
            suggestion:
               "Use contentGapFinder to identify differentiation opportunities",
         });
      }

      // Facts Gathered
      const factPoints = SCORING_CRITERIA.factsGathered.points;
      if (completedResearch.factsGathered >= 5) {
         breakdown.push({
            criterion: SCORING_CRITERIA.factsGathered.description,
            points: factPoints,
            earned: factPoints,
            status: "complete",
         });
         totalScore += factPoints;
      } else if (completedResearch.factsGathered >= 2) {
         const earnedPoints = Math.round(
            (completedResearch.factsGathered / 5) * factPoints,
         );
         breakdown.push({
            criterion: SCORING_CRITERIA.factsGathered.description,
            points: factPoints,
            earned: earnedPoints,
            status: "partial",
            suggestion: `Gather ${5 - completedResearch.factsGathered} more facts for stronger content`,
         });
         totalScore += earnedPoints;
      } else {
         breakdown.push({
            criterion: SCORING_CRITERIA.factsGathered.description,
            points: factPoints,
            earned: 0,
            status: "missing",
            suggestion:
               "Use factFinder to gather statistics, studies, and quotes",
         });
      }

      // Deep Crawl
      const crawlPoints = SCORING_CRITERIA.deepCrawl.points;
      if (completedResearch.deepCrawlCount >= 1) {
         breakdown.push({
            criterion: SCORING_CRITERIA.deepCrawl.description,
            points: crawlPoints,
            earned: crawlPoints,
            status: "complete",
         });
         totalScore += crawlPoints;
      } else {
         breakdown.push({
            criterion: SCORING_CRITERIA.deepCrawl.description,
            points: crawlPoints,
            earned: 0,
            status: "missing",
            suggestion:
               "Use webCrawl on at least one authoritative URL for detailed insights",
         });
      }

      // Adjust minimum score for complex topics
      let adjustedMinimum = MINIMUM_SCORE;
      if (topicComplexity === "complex") {
         adjustedMinimum = 80;
      } else if (topicComplexity === "simple") {
         adjustedMinimum = 60;
      }

      const canProceed = totalScore >= adjustedMinimum;

      // Collect missing items
      const missing = breakdown
         .filter((b) => b.status === "missing")
         .map((b) => b.criterion);

      // Generate recommendations
      const recommendations: string[] = [];

      if (!canProceed) {
         recommendations.push(
            `Score ${totalScore}/100 is below minimum ${adjustedMinimum}. Complete more research before creating the plan.`,
         );
      }

      const partialItems = breakdown.filter((b) => b.status === "partial");
      for (const item of partialItems) {
         if (item.suggestion) {
            recommendations.push(item.suggestion);
         }
      }

      const missingItems = breakdown.filter((b) => b.status === "missing");
      for (const item of missingItems.slice(0, 3)) {
         if (item.suggestion) {
            recommendations.push(item.suggestion);
         }
      }

      if (canProceed && totalScore < 90) {
         recommendations.push(
            "Research is sufficient. Consider additional tools for a more comprehensive plan.",
         );
      } else if (totalScore >= 90) {
         recommendations.push(
            "Excellent research coverage! Proceed with creating the plan.",
         );
      }

      // Determine quality level
      let qualityLevel:
         | "insufficient"
         | "basic"
         | "good"
         | "excellent"
         | "comprehensive";
      if (totalScore < adjustedMinimum) {
         qualityLevel = "insufficient";
      } else if (totalScore < 70) {
         qualityLevel = "basic";
      } else if (totalScore < 85) {
         qualityLevel = "good";
      } else if (totalScore < 95) {
         qualityLevel = "excellent";
      } else {
         qualityLevel = "comprehensive";
      }

      return {
         score: totalScore,
         canProceed,
         minimumScore: adjustedMinimum,
         breakdown,
         missing,
         recommendations,
         qualityLevel,
      };
   },
});
