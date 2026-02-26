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

function extractFrontmatter(text: string): Record<string, string> | null {
	const match = text.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;
	const fm: Record<string, string> = {};
	for (const line of match[1].split("\n")) {
		const colonIdx = line.indexOf(":");
		if (colonIdx > 0) {
			fm[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
		}
	}
	return fm;
}

export const seoQualityScorer = createScorer({
	id: "seo-quality",
	description:
		"Evaluates SEO metadata completeness: title, description, slug, keywords, keyword usage",
	type: "agent",
})
	.analyze(({ run }) => {
		const text = extractText(run.output as any[]);
		const fm = extractFrontmatter(text);
		const hasTitle = !!fm?.title && fm.title.length > 0;
		const hasDescription = !!fm?.description && fm.description.length > 0;
		const hasSlug = !!fm?.slug && fm.slug.length > 0;
		const keywordsRaw = fm?.keywords ?? "";
		const hasKeywords = keywordsRaw.includes("[") && keywordsRaw.includes("]");
		const keywordList =
			keywordsRaw.match(/"([^"]+)"/g)?.map((k) => k.replace(/"/g, "")) ?? [];
		const bodyText = text.replace(/^---[\s\S]*?---/, "").toLowerCase();
		const keywordInBody = keywordList.some((kw) =>
			bodyText.includes(kw.toLowerCase()),
		);
		return {
			score: 0,
			result: { hasTitle, hasDescription, hasSlug, hasKeywords, keywordInBody },
		};
	})
	.generateScore(({ results }) => {
		const analyzeResult = results.analyzeStepResult as
			| {
					score: number;
					result: {
						hasTitle: boolean;
						hasDescription: boolean;
						hasSlug: boolean;
						hasKeywords: boolean;
						keywordInBody: boolean;
					};
			  }
			| undefined;
		const r = analyzeResult?.result;
		if (!r) return 0;
		let score = 0;
		if (r.hasTitle) score += 0.2;
		if (r.hasDescription) score += 0.2;
		if (r.hasSlug) score += 0.2;
		if (r.hasKeywords) score += 0.2;
		if (r.keywordInBody) score += 0.2;
		return score;
	});
