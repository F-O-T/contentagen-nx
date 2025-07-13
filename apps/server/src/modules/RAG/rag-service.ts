import type { KnowledgeSource } from "@api/schemas/agent-schema";
import { tavily } from "@tavily/core";
import { generateEmbedding } from "./rag-utils";
import { findChunksBySource } from "./rag-repository";
import { env } from "@api/config/env";

export async function findSimilarChunksForString(
   content: string,
   agentId: string,
   source: KnowledgeSource,
) {
   const embedding = await generateEmbedding(content);
   return findChunksBySource(embedding, { agentId, source });
}

export interface TavilySearchResult {
   query: string;
   answer?: string;
   results: Array<{
      title: string;
      url: string;
      content: string;
      score?: number;
      raw_content?: string | null;
      favicon?: string;
   }>;
   auto_parameters?: Record<string, unknown>;
   response_time?: string;
}

export async function tavilyWebSearch(
   query: string,
   options?: {
      maxResults?: number;
      includeAnswer?: boolean;
      searchDepth?: "basic" | "advanced";
      topic?: "general" | "news";
   },
): Promise<TavilySearchResult> {
   const apiKey = env.TAVILY_API_KEY;
   if (!apiKey) throw new Error("Tavily API key not set");
   const client = tavily({ apiKey });
   console.log("Tavily search query:", query, "with options:", options);
   return await client.search(query, {
      max_results: options?.maxResults ?? 5,
      include_answer: options?.includeAnswer ?? true,
      search_depth: options?.searchDepth ?? "basic",
      topic: options?.topic ?? "general",
   });
}
