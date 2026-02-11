import { createTool } from "@mastra/core/tools";
import { AppError, propagateError } from "@packages/utils/errors";
import { embed } from "ai";
import { z } from "zod";
import {
   CONTENT_METADATA_INDEX,
   embeddingModel,
   initializeRagService,
   isRagAvailable,
   ragService,
} from "../../rag/rag-service";
import type { ContentMetadata } from "../../rag/types";

// Graph traversal threshold (0.7 = only strong connections)
const GRAPH_SIMILARITY_THRESHOLD = 0.7;

export function getGraphSearchInstructions(): string {
   return `
## GRAPH SEARCH TOOL
Searches content using relationship-based traversal for deeper discovery.

**When to use:**
- **Finding indirect connections**: Discover content related through topic clusters
- **Topic exploration**: Find all content in a semantic neighborhood
- **Content gaps**: Identify areas with limited coverage

**Parameters:**
- query (string): Starting point for graph traversal
- depth (number, optional): How many hops to traverse (1-3, default: 2)
- limit (number, optional): Max results to return (default: 10)

**How it works:**
1. Finds initial content matching your query
2. Traverses semantic connections to find related content
3. Returns content that may not directly match but is contextually related

**Examples:**
- graphSearch({ query: "React state management", depth: 2 })
- graphSearch({ query: "SEO optimization", depth: 1, limit: 5 })

**Output format:**
- results: Array of { slug, title, description, relevance, depth }
  - depth indicates how many hops from the original query

**Best practices:**
1. Use depth=1 for tightly related content
2. Use depth=2-3 for broader topic exploration
3. Higher relevance scores indicate stronger connections
`;
}

interface GraphSearchResult {
   slug: string;
   title: string;
   description: string;
   relevance: string;
   depth: number;
}

export const graphSearchTool = createTool({
   id: "graph-search",
   description:
      "Search content using graph-based traversal for relationship discovery",
   inputSchema: z.object({
      query: z
         .string()
         .describe("Starting point for graph-based content discovery"),
      depth: z
         .number()
         .min(1)
         .max(3)
         .default(2)
         .describe("How many relationship hops to traverse (1-3)"),
      limit: z
         .number()
         .min(1)
         .max(20)
         .default(10)
         .describe("Maximum number of results to return"),
   }),
   execute: async (inputData, context) => {
      const { query, depth = 2, limit = 10 } = inputData;
      const requestContext = context?.requestContext;

      if (!requestContext?.has("writerId")) {
         throw AppError.validation("Missing writerId in request context");
      }

      const writerId = requestContext.get("writerId") as string;

      if (!isRagAvailable()) {
         return {
            results: [],
            message: "RAG search not available - PG_VECTOR_URL not configured",
         };
      }

      try {
         await initializeRagService();
         const store = ragService.getStore();

         // Create embedding for the initial query
         const { embedding: queryEmbedding } = await embed({
            model: embeddingModel,
            value: query,
         });

         // Track visited content to avoid duplicates
         const visited = new Set<string>();
         const results: GraphSearchResult[] = [];

         // BFS-style graph traversal
         let currentEmbeddings = [queryEmbedding];
         let currentDepth = 0;

         while (currentDepth < depth && results.length < limit) {
            const nextEmbeddings: number[][] = [];

            for (const embedding of currentEmbeddings) {
               if (results.length >= limit) break;

               const searchResults = await store.query({
                  indexName: CONTENT_METADATA_INDEX,
                  queryVector: embedding,
                  topK: Math.min(5, limit - results.length),
                  filter: { writerId: { $eq: writerId } },
                  minScore:
                     currentDepth === 0 ? 0.4 : GRAPH_SIMILARITY_THRESHOLD,
               });

               for (const result of searchResults) {
                  const metadata =
                     result.metadata as unknown as ContentMetadata;

                  // Skip if already visited
                  if (visited.has(metadata.externalId)) continue;
                  visited.add(metadata.externalId);

                  results.push({
                     slug: metadata.slug,
                     title: metadata.title,
                     description: metadata.description,
                     relevance: `${Math.round(result.score * 100)}%`,
                     depth: currentDepth + 1,
                  });

                  // Get embedding for next hop (using the metadata text)
                  if (currentDepth + 1 < depth && results.length < limit) {
                     const { embedding: nextEmbedding } = await embed({
                        model: embeddingModel,
                        value: metadata.text,
                     });
                     nextEmbeddings.push(nextEmbedding);
                  }
               }
            }

            currentEmbeddings = nextEmbeddings;
            currentDepth++;
         }

         // Sort by depth (closer = more relevant), then by relevance
         results.sort((a, b) => {
            if (a.depth !== b.depth) return a.depth - b.depth;
            return Number.parseInt(b.relevance) - Number.parseInt(a.relevance);
         });

         return {
            results: results.slice(0, limit),
            searchQuery: query,
            traversalDepth: depth,
            totalFound: results.length,
         };
      } catch (error) {
         console.error("Failed to perform graph search:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to perform graph search: ${(error as Error).message}`,
         );
      }
   },
});
