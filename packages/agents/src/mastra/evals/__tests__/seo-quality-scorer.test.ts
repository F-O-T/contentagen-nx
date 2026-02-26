import { describe, expect, test } from "bun:test";
import { seoQualityScorer } from "../seo-quality-scorer";

function makeOutput(text: string) {
	return [
		{
			role: "assistant",
			content: text,
			id: "1",
			threadId: "t1",
			resourceId: "r1",
			createdAt: new Date(),
			type: "text",
		},
	] as any;
}

const GOOD_SEO = `---
title: "TypeScript Generics Guide"
description: "Learn TypeScript generics from scratch"
slug: "typescript-generics-guide"
keywords: ["typescript", "generics", "types"]
---

## TypeScript generics are powerful

The typescript keyword and generics system are central to type safety.
`;

const POOR_SEO = `Just some text without any frontmatter or SEO optimization at all.`;

describe("seoQualityScorer", () => {
	test("scorer has correct id", () => {
		expect(seoQualityScorer.id).toBe("seo-quality");
	});

	test("scores well-structured SEO content near 1.0", async () => {
		const result = await seoQualityScorer.run({
			input: {} as any,
			output: makeOutput(GOOD_SEO),
		});
		expect(result.score).toBeGreaterThanOrEqual(0.8);
	});

	test("scores poor SEO content near 0.0", async () => {
		const result = await seoQualityScorer.run({
			input: {} as any,
			output: makeOutput(POOR_SEO),
		});
		expect(result.score).toBeLessThanOrEqual(0.2);
	});
});
