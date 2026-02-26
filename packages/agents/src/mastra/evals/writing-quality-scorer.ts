import { createScorer } from "@mastra/core/evals";

const AI_FILLER_PATTERNS = [
	/it'?s important to note/i,
	/in conclusion/i,
	/as we can see/i,
	/it is worth noting/i,
	/needless to say/i,
	/at the end of the day/i,
	/when all is said and done/i,
	/to summarize/i,
];

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

export const writingQualityScorer = createScorer({
	id: "writing-quality",
	description:
		"Evaluates writing quality: frontmatter, length, headings, and absence of AI filler",
	type: "agent",
})
	.analyze(({ run }) => {
		const text = extractText(run.output as any[]);
		const hasFrontmatter = text.trimStart().startsWith("---");
		const hasMinLength = text.length >= 400;
		const hasHeadings = /^#{2,3}\s/m.test(text);
		const hasFillerPhrases = AI_FILLER_PATTERNS.some((re) => re.test(text));
		return {
			score: 0,
			result: { hasFrontmatter, hasMinLength, hasHeadings, hasFillerPhrases },
		};
	})
	.generateScore(({ results }) => {
		const analyzeResult = results.analyzeStepResult as
			| {
					score: number;
					result: {
						hasFrontmatter: boolean;
						hasMinLength: boolean;
						hasHeadings: boolean;
						hasFillerPhrases: boolean;
					};
			  }
			| undefined;
		const r = analyzeResult?.result;
		if (!r) return 0;
		// If the content has no minimum length it earns no score at all
		if (!r.hasMinLength) return 0;
		let score = 0;
		if (r.hasFrontmatter) score += 0.25;
		score += 0.25; // hasMinLength already true here
		if (r.hasHeadings) score += 0.25;
		if (!r.hasFillerPhrases) score += 0.25;
		return score;
	});
