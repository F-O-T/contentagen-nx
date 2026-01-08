import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createPgVector } from "@packages/rag/client";
import {
	type SearchMode,
	searchRelatedContent,
} from "@packages/rag/repositories/content-rag-repository";
import { AppError, propagateError } from "@packages/utils/errors";
import { z } from "zod";

export function getSearchPreviousContentInstructions(): string {
	return `
## SEARCH PREVIOUS CONTENT TOOL
Searches your previously published content to find related posts and context.

**When to use:**
- **For internal linking**: Find related posts to link to ("See our guide on X")
- **For consistency**: Check terminology, facts, or tone used in past content
- **For avoiding duplication**: Ensure you're not repeating what you've already written

**Parameters:**
- query (string): What you're looking for (e.g., "SEO best practices", "React hooks tutorial")
- mode (enum):
  - "links" - Returns post titles/slugs for internal linking
  - "context" - Returns content chunks for reference
  - "both" - Returns both (recommended for comprehensive search)
- limit (number, optional): Max results (default: 5 for links, 10 for chunks)

**Examples:**
- Looking for posts to link: searchPreviousContent({ query: "beginner SEO guide", mode: "links" })
- Checking past terminology: searchPreviousContent({ query: "API authentication", mode: "context" })
- Comprehensive search: searchPreviousContent({ query: "React performance", mode: "both" })

**Output format:**
- relatedPosts: Array of { slug, title, description, similarity }
- relevantChunks: Array of { chunk, similarity }

**Best practices:**
1. Use "links" mode when you want to add internal links to your content
2. Use "context" mode to maintain consistency with previously written content
3. Use "both" mode during planning to understand existing content coverage
4. Higher similarity scores (>0.7) indicate stronger relevance
`;
}

export const searchPreviousContentTool = createTool({
	id: "search-previous-content",
	description:
		"Search previously published content for internal linking suggestions and context reference",
	inputSchema: z.object({
		query: z
			.string()
			.describe("Search query describing what content you're looking for"),
		mode: z
			.enum(["links", "context", "both"])
			.default("both")
			.describe(
				"Search mode: 'links' for post suggestions, 'context' for content chunks, 'both' for comprehensive search",
			),
		limit: z
			.number()
			.min(1)
			.max(20)
			.optional()
			.describe("Maximum number of results to return"),
	}),
	execute: async (inputData, context) => {
		const { query, mode, limit } = inputData;
		const requestContext = context?.requestContext;

		if (!requestContext?.has("agentId")) {
			throw AppError.validation("Missing agentId in request context");
		}

		const agentId = requestContext.get("agentId") as string;

		if (!serverEnv.PG_VECTOR_URL) {
			return {
				relatedPosts: [],
				relevantChunks: [],
				message: "RAG search not available - PG_VECTOR_URL not configured",
			};
		}

		try {
			const ragClient = createPgVector({
				pgVectorURL: serverEnv.PG_VECTOR_URL,
			});

			const results = await searchRelatedContent(
				ragClient,
				query,
				agentId,
				mode as SearchMode,
				{
					limit: limit || (mode === "context" ? 10 : 5),
					similarityThreshold: 0.4, // Lower threshold for better recall
				},
			);

			// Format for agent consumption
			return {
				relatedPosts: results.relatedPosts.map((post) => ({
					slug: post.slug,
					title: post.title,
					description: post.description,
					relevance: Math.round(post.similarity * 100) + "%",
				})),
				relevantChunks: results.relevantChunks.map((chunk) => ({
					content: chunk.chunk,
					relevance: Math.round(chunk.similarity * 100) + "%",
				})),
				searchQuery: query,
				mode,
			};
		} catch (error) {
			console.error("Failed to search previous content:", error);
			propagateError(error);
			throw AppError.internal(
				`Failed to search previous content: ${(error as Error).message}`,
			);
		}
	},
});
