import { beforeAll, describe, expect, it, mock } from "bun:test";

// Mock heavy env/DB dependencies before any workspace import
mock.module("@packages/environment/server", () => ({
	env: {
		PG_VECTOR_URL: "postgresql://localhost/test",
		OPENROUTER_API_KEY: "test-key",
	},
}));

mock.module("@mastra/pg", () => ({
	PgVector: class {
		constructor() {}
	},
	PostgresStore: class {
		constructor() {}
	},
}));

mock.module("../utils", () => ({
	pgVectorStore: {},
	embeddingModel: {},
	disconnectVectorStore: async () => {},
	buildLanguageInstruction: () => "",
	compileInstructionMemories: () => "",
}));

// Dynamically import workspace after mocks are in place
const { workspace } = (await import(
	"../mastra/workspace"
)) as typeof import("../mastra/workspace");

describe("workspace skill discovery", () => {
	beforeAll(async () => {
		await workspace.init();
	});

	it("returns results for SEO-related query", async () => {
		const results = await workspace.search(
			"SEO otimização título meta description",
			{ mode: "bm25" },
		);

		expect(results.length).toBeGreaterThan(0);
		const topResult = results[0];
		expect(topResult.score).toBeGreaterThan(0);
		expect(topResult.content).toBeTruthy();
	});

	it("returns results for research query", async () => {
		const results = await workspace.search(
			"pesquisa de conteúdo web search",
			{ mode: "bm25" },
		);

		expect(results.length).toBeGreaterThan(0);
	});

	it("returns results for frontmatter query", async () => {
		const results = await workspace.search(
			"frontmatter título slug keywords",
			{ mode: "bm25" },
		);

		expect(results.length).toBeGreaterThan(0);
	});

	it("returns results for writing query", async () => {
		const results = await workspace.search(
			"escrita artigo blog diretrizes",
			{ mode: "bm25" },
		);

		expect(results.length).toBeGreaterThan(0);
	});
});
