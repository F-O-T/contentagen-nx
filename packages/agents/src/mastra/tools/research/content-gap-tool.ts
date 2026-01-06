import { createTool } from "@mastra/core/tools";
import { crawl } from "@packages/search";
import { AppError } from "@packages/utils/errors";
import { z } from "zod";

export const contentGapTool = createTool({
	id: "content-gap-finder",
	description:
		"Analyzes multiple competitor URLs to identify content gaps and differentiation opportunities. Compares heading structures and topics to find what competitors are missing.",
	inputSchema: z.object({
		topic: z.string().describe("The main topic being researched"),
		competitorUrls: z
			.array(z.string().url())
			.min(2)
			.max(5)
			.describe("URLs of competitor articles to compare (2-5 URLs)"),
	}),
	outputSchema: z.object({
		topic: z.string(),
		analyzedUrls: z.number(),
		commonTopics: z.array(
			z.object({
				topic: z.string(),
				coverage: z.number().describe("How many competitors cover this"),
				importance: z.enum(["essential", "recommended", "optional"]),
			})
		),
		uniqueTopics: z.array(
			z.object({
				topic: z.string(),
				foundIn: z.string(),
				potentialValue: z.enum(["high", "medium", "low"]),
			})
		),
		gaps: z.array(
			z.object({
				gap: z.string(),
				description: z.string(),
				opportunity: z.enum(["high", "medium", "low"]),
			})
		),
		structureInsights: z.object({
			avgHeadingCount: z.number(),
			avgWordCount: z.number(),
			commonStructurePattern: z.string(),
		}),
		recommendations: z.array(z.string()),
	}),
	execute: async (inputData) => {
		const { topic, competitorUrls } = inputData;

		try {
			// Crawl all competitor URLs
			const crawlResults = await Promise.all(
				competitorUrls.map(async (url) => {
					try {
						const { result } = await crawl(url);
						return { url, result, success: true };
					} catch {
						return { url, result: null, success: false };
					}
				})
			);

			const successfulCrawls = crawlResults.filter(
				(r): r is { url: string; result: NonNullable<typeof r.result>; success: true } =>
					r.success && r.result !== null
			);

			if (successfulCrawls.length < 2) {
				throw AppError.internal(
					"Could not crawl enough competitor URLs (need at least 2)"
				);
			}

			// Extract headings and topics from each competitor
			const competitorData: Array<{
				url: string;
				headings: string[];
				topics: Set<string>;
				wordCount: number;
			}> = [];

			// Stop words for topic extraction
			const stopWords = new Set([
				"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
				"of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
				"have", "has", "had", "do", "does", "did", "will", "would", "could",
				"should", "may", "might", "must", "that", "this", "it", "you", "your",
				"we", "our", "they", "their", "what", "how", "why", "when", "where",
				"which", "who", "its", "can", "just", "than", "then", "now", "only",
			]);

			for (const { url, result } of successfulCrawls) {
				const markdown = result.markdown || result.content;

				// Extract headings (H1-H3)
				const headingMatches = markdown.match(/^#{1,3}\s+(.+)$/gm) || [];
				const headings = headingMatches.map((h: string) =>
					h.replace(/^#+\s+/, "").trim()
				);

				// Extract topics from headings (normalize for comparison)
				const topics = new Set<string>();
				for (const heading of headings) {
					// Normalize: lowercase, remove special chars, split into key phrases
					const normalized = heading
						.toLowerCase()
						.replace(/[^\w\s]/g, " ")
						.replace(/\s+/g, " ")
						.trim();

					// Extract meaningful phrases (2-4 words)
					const words = normalized.split(" ").filter((w) => !stopWords.has(w));
					if (words.length >= 1) {
						topics.add(words.slice(0, 4).join(" "));
					}
				}

				const wordCount =
					result.metadata?.wordCount ||
					result.content.split(/\s+/).filter(Boolean).length;

				competitorData.push({ url, headings, topics, wordCount });
			}

			// Find common topics (covered by multiple competitors)
			const topicCoverage: Record<string, { count: number; urls: string[] }> = {};

			for (const { url, topics } of competitorData) {
				for (const t of topics) {
					if (!topicCoverage[t]) {
						topicCoverage[t] = { count: 0, urls: [] };
					}
					topicCoverage[t].count++;
					topicCoverage[t].urls.push(url);
				}
			}

			const commonTopics = Object.entries(topicCoverage)
				.filter(([, data]) => data.count >= 2)
				.sort((a, b) => b[1].count - a[1].count)
				.map(([t, data]) => ({
					topic: t,
					coverage: data.count,
					importance:
						data.count === successfulCrawls.length
							? ("essential" as const)
							: data.count >= successfulCrawls.length / 2
								? ("recommended" as const)
								: ("optional" as const),
				}));

			// Find unique topics (only covered by one competitor)
			const uniqueTopics = Object.entries(topicCoverage)
				.filter(([, data]) => data.count === 1 && data.urls.length > 0)
				.map(([t, data]) => ({
					topic: t,
					foundIn: data.urls[0] as string, // Safe: we filtered for urls.length > 0
					potentialValue:
						t.split(" ").length >= 3
							? ("high" as const)
							: t.split(" ").length >= 2
								? ("medium" as const)
								: ("low" as const),
				}))
				.slice(0, 15);

			// Identify gaps (what NO competitor covers well)
			const gaps: Array<{
				gap: string;
				description: string;
				opportunity: "high" | "medium" | "low";
			}> = [];

			// Common gap patterns to check
			const gapPatterns = [
				{
					pattern: /example|case study|real.?world/i,
					gap: "Practical examples",
					description: "Add real-world examples or case studies",
				},
				{
					pattern: /comparison|vs|versus|alternative/i,
					gap: "Comparisons",
					description: "Add comparisons with alternatives or competitors",
				},
				{
					pattern: /faq|question|common/i,
					gap: "FAQ section",
					description: "Add frequently asked questions section",
				},
				{
					pattern: /video|visual|diagram|infographic/i,
					gap: "Visual content",
					description: "Add diagrams, infographics, or video embeds",
				},
				{
					pattern: /step.?by.?step|guide|tutorial|how.?to/i,
					gap: "Step-by-step guide",
					description: "Add detailed step-by-step instructions",
				},
				{
					pattern: /download|template|checklist|resource/i,
					gap: "Downloadable resources",
					description: "Add templates, checklists, or downloadable resources",
				},
				{
					pattern: /expert|interview|quote/i,
					gap: "Expert insights",
					description: "Add expert quotes or interview insights",
				},
				{
					pattern: /statistic|data|research|study/i,
					gap: "Statistics and data",
					description: "Add statistics, research data, or study references",
				},
			];

			// Check which patterns are missing across all competitors
			const allHeadings = competitorData.flatMap((c) => c.headings).join(" ");

			for (const { pattern, gap, description } of gapPatterns) {
				if (!pattern.test(allHeadings)) {
					gaps.push({
						gap,
						description,
						opportunity: "high",
					});
				}
			}

			// Check for thin coverage areas
			const thinTopics = Object.entries(topicCoverage)
				.filter(
					([, data]) =>
						data.count === 1 && data.count < successfulCrawls.length - 1
				)
				.map(([t]) => t);

			if (thinTopics.length > 3) {
				gaps.push({
					gap: "Topic depth",
					description: `Several topics are only covered by one competitor: ${thinTopics.slice(0, 3).join(", ")}`,
					opportunity: "medium",
				});
			}

			// Calculate structure insights
			const avgHeadingCount = Math.round(
				competitorData.reduce((sum, c) => sum + c.headings.length, 0) /
					competitorData.length
			);

			const avgWordCount = Math.round(
				competitorData.reduce((sum, c) => sum + c.wordCount, 0) /
					competitorData.length
			);

			// Determine common structure pattern
			let commonStructurePattern = "Mixed format";
			if (commonTopics.some((t) => /step|how|guide/i.test(t.topic))) {
				commonStructurePattern = "Tutorial/How-to format";
			} else if (commonTopics.some((t) => /\d+|list|best|top/i.test(t.topic))) {
				commonStructurePattern = "Listicle format";
			} else if (
				commonTopics.some((t) => /what|definition|explain/i.test(t.topic))
			) {
				commonStructurePattern = "Educational/Explainer format";
			}

			// Generate recommendations
			const recommendations: string[] = [];

			recommendations.push(
				`Target word count: ${avgWordCount}+ words (match or exceed competitors)`
			);
			recommendations.push(
				`Include ${avgHeadingCount}+ subheadings for proper structure`
			);

			const essentialTopics = commonTopics.filter(
				(t) => t.importance === "essential"
			);
			if (essentialTopics.length > 0) {
				recommendations.push(
					`Essential topics to cover: ${essentialTopics.map((t) => t.topic).join(", ")}`
				);
			}

			const highValueGaps = gaps.filter((g) => g.opportunity === "high");
			if (highValueGaps.length > 0) {
				recommendations.push(
					`Differentiate with: ${highValueGaps.map((g) => g.gap).join(", ")}`
				);
			}

			const highValueUnique = uniqueTopics.filter(
				(t) => t.potentialValue === "high"
			);
			if (highValueUnique.length > 0) {
				recommendations.push(
					`Consider unique angles: ${highValueUnique.map((t) => t.topic).slice(0, 3).join(", ")}`
				);
			}

			return {
				topic,
				analyzedUrls: successfulCrawls.length,
				commonTopics,
				uniqueTopics,
				gaps,
				structureInsights: {
					avgHeadingCount,
					avgWordCount,
					commonStructurePattern,
				},
				recommendations,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw AppError.internal(
				`Content gap analysis failed: ${(error as Error).message}`
			);
		}
	},
});

export function getContentGapInstructions(): string {
	return `
## CONTENT GAP FINDER TOOL
Compares multiple competitor articles to find differentiation opportunities.

**When to use:** After serpAnalysis and competitorContent to identify what's missing

**Parameters:**
- topic (string): The main topic being researched
- competitorUrls (array): 2-5 competitor URLs to compare

**Returns:**
- commonTopics: Topics covered by multiple competitors (with importance level)
- uniqueTopics: Topics only one competitor covers (potential differentiators)
- gaps: Content types/approaches NO competitor does well (high opportunity)
- structureInsights: Average heading count, word count, common format
- recommendations: Actionable suggestions for differentiation

**Tips:**
- Essential topics (covered by all) MUST be in your content
- Gaps with "high" opportunity are your best differentiation points
- Match or exceed avgWordCount for competitive length
- Unique topics can inspire fresh angles
`;
}
