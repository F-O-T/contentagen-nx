import { beforeAll, describe, expect, it } from "bun:test";
import { workspace } from "../mastra/workspace";

// Mocks are registered in workspace-mocks.ts (preloaded via bunfig.toml [test] preload)
// before this file's static imports are resolved, so ../mastra/workspace loads
// with all heavy env/DB dependencies already stubbed out.

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
		// Top result is /otimizacao-seo/SKILL.md — content contains the skill name and heading
		expect(topResult.content).toMatch(/otimizacao-seo|Otimiza[çc][aã]o/i);
	});

	it("returns results for research query", async () => {
		const results = await workspace.search(
			"pesquisa de conteúdo web search",
			{ mode: "bm25" },
		);

		expect(results.length).toBeGreaterThan(0);
		const topResult = results[0];
		expect(topResult.score).toBeGreaterThan(0);
		expect(topResult.content).toBeTruthy();
		// Top result is a reference file about content prioritization — contains research-adjacent terms
		expect(topResult.content).toMatch(/conte[uú]do|busca|SERP|pesquisa/i);
	});

	it("returns results for frontmatter query", async () => {
		const results = await workspace.search(
			"frontmatter título slug keywords",
			{ mode: "bm25" },
		);

		expect(results.length).toBeGreaterThan(0);
		const topResult = results[0];
		expect(topResult.score).toBeGreaterThan(0);
		expect(topResult.content).toBeTruthy();
		// Top result is /gestao-de-frontmatter/SKILL.md — content contains the skill name and heading
		expect(topResult.content).toMatch(/gestao-de-frontmatter|[Ff]rontmatter/);
	});

	it("returns results for writing query", async () => {
		const results = await workspace.search(
			"escrita artigo blog diretrizes",
			{ mode: "bm25" },
		);

		expect(results.length).toBeGreaterThan(0);
		const topResult = results[0];
		expect(topResult.score).toBeGreaterThan(0);
		expect(topResult.content).toBeTruthy();
		// Top result is /diretrizes-de-escrita/SKILL.md — content contains the skill name and heading
		expect(topResult.content).toMatch(/diretrizes-de-escrita|[Ee]scrita/);
	});
});
