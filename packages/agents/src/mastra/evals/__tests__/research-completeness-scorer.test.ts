import { describe, expect, test } from "bun:test";
import { researchCompletenessScorer } from "../research-completeness-scorer";

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

const GOOD_RESEARCH = `
According to a 2024 study by Stanford University, TypeScript adoption has grown 40% year-over-year.
Research from GitHub shows that 78% of developers use TypeScript in enterprise projects.
See: https://example.com/typescript-study and https://github.com/microsoft/typescript

Compared to JavaScript, TypeScript offers stronger type safety. In contrast to Python's type hints,
TypeScript's generics provide compile-time checking. Unlike Flow, TypeScript has better IDE support.

Sources: Stack Overflow Developer Survey 2024, GitHub State of Open Source 2024, JetBrains Developer Survey.
The data clearly shows TypeScript's dominance in modern web development.
`.repeat(2);

const POOR_RESEARCH = `TypeScript is a programming language. It is useful for large projects.`;

describe("researchCompletenessScorer", () => {
	test("scorer has correct id", () => {
		expect(researchCompletenessScorer.id).toBe("research-completeness");
	});

	test("scores thorough research near 1.0", async () => {
		const result = await researchCompletenessScorer.run({
			input: {} as any,
			output: makeOutput(GOOD_RESEARCH),
		});
		expect(result.score).toBeGreaterThanOrEqual(0.6);
	});

	test("scores shallow research near 0.0", async () => {
		const result = await researchCompletenessScorer.run({
			input: {} as any,
			output: makeOutput(POOR_RESEARCH),
		});
		expect(result.score).toBeLessThanOrEqual(0.4);
	});
});
