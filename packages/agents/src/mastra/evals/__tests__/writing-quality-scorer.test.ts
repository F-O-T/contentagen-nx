import { describe, expect, test } from "bun:test";
import { writingQualityScorer } from "../writing-quality-scorer";

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

const GOOD_ARTICLE = `---
title: "Understanding TypeScript Generics"
description: "A deep dive into TypeScript generics"
slug: "typescript-generics"
keywords: ["typescript", "generics"]
---

## What are TypeScript Generics?

TypeScript generics allow you to write flexible, reusable code that works with any type.
They are one of the most powerful features in the TypeScript type system.

### Basic Generic Functions

Generic functions are defined with angle bracket syntax.
This enables type-safe operations across many different data types without code duplication.

## Advanced Generic Patterns

Constraints, conditional types, and mapped types extend generics into extremely powerful patterns.
Additional content to reach minimum length requirement for the scorer threshold.
`.repeat(3);

const POOR_ARTICLE = `It's important to note that generics are useful. In conclusion, as we can see, they help.`;

describe("writingQualityScorer", () => {
	test("scorer has correct id", () => {
		expect(writingQualityScorer.id).toBe("writing-quality");
	});

	test("scores high-quality article near 1.0", async () => {
		const result = await writingQualityScorer.run({
			input: {} as any,
			output: makeOutput(GOOD_ARTICLE),
		});
		expect(result.score).toBeGreaterThanOrEqual(0.75);
	});

	test("scores poor article near 0.0", async () => {
		const result = await writingQualityScorer.run({
			input: {} as any,
			output: makeOutput(POOR_ARTICLE),
		});
		expect(result.score).toBeLessThanOrEqual(0.5);
	});

	test("empty output gets score 0", async () => {
		const result = await writingQualityScorer.run({
			input: {} as any,
			output: makeOutput(""),
		});
		expect(result.score).toBe(0);
	});
});
