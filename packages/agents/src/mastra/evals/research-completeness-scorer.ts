import { createScorer } from "@mastra/core/evals";

function extractText(output: any[]): string {
	return output
		.map((m) =>
			typeof m.content === "string"
				? m.content
				: Array.isArray(m.content)
					? m.content
							.filter((c: { type: string }) => c.type === "text")
							.map((c: { text: string }) => c.text)
							.join("")
					: "",
		)
		.join("\n");
}

export const researchCompletenessScorer = createScorer({
	id: "research-completeness",
	description:
		"Evaluates research quality: citations, statistics, sources, comparative analysis, depth",
	type: "agent",
})
	.analyze(({ run }) => {
		const text = extractText(run.output as any[]);
		const hasUrls = /https?:\/\/\S+/.test(text);
		const hasStatistics = /\d+\s*%|\d+x\s|\d{4}\s+study/i.test(text);
		const hasNamedSources =
			/according to|study|research|survey|report|data shows/i.test(text);
		const hasComparativeLanguage =
			/compared to|unlike|in contrast|versus|\bvs\b|rather than/i.test(text);
		const hasMinDepth = text.length >= 300;
		return {
			score: 0,
			result: {
				hasUrls,
				hasStatistics,
				hasNamedSources,
				hasComparativeLanguage,
				hasMinDepth,
			},
		};
	})
	.generateScore(({ results }) => {
		const analyzeResult = results.analyzeStepResult as
			| {
					score: number;
					result: {
						hasUrls: boolean;
						hasStatistics: boolean;
						hasNamedSources: boolean;
						hasComparativeLanguage: boolean;
						hasMinDepth: boolean;
					};
			  }
			| undefined;
		const r = analyzeResult?.result;
		if (!r) return 0;
		let score = 0;
		if (r.hasUrls) score += 0.2;
		if (r.hasStatistics) score += 0.2;
		if (r.hasNamedSources) score += 0.2;
		if (r.hasComparativeLanguage) score += 0.2;
		if (r.hasMinDepth) score += 0.2;
		return score;
	});
