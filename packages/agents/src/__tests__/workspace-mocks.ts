import { mock } from "bun:test";

// Preload file: runs before test file static imports, so mock.module() calls
// here intercept modules before workspace.test.ts imports ../mastra/workspace.

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
