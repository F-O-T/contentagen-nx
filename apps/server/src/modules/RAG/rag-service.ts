import { eq } from "drizzle-orm";
import { agent as agentTable } from "../../schemas/agent-schema";
import type { KnowledgeSource } from "@api/schemas/agent-schema";
import { tavily } from "@tavily/core";
import { generateEmbedding } from "./rag-utils";
import { findChunksBySource } from "./rag-repository";
import { env } from "@api/config/env";
import { db } from "@api/integrations/database";
import { distillQueue } from "@api/workers/distill-worker";
import { uploadFile } from "@api/integrations/minio";

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
   results?: Array<{
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

// New: Extract brand/product info from website using Tavily and save as knowledge chunks
// Placeholder for your LLM call (implement with OpenAI, Together, etc.)
// Unified LLM call supporting multiple providers (OpenAI, Together, Gemini, etc.)
// Use native fetch (Node.js 18+)

export interface AllLLMOptions {
   model?: string;
   systemPrompt?: string;
   temperature?: number;
   maxTokens?: number;
}

export async function allLLM({
   prompt,
   options,
}: {
   prompt: string;
   options?: AllLLMOptions;
}): Promise<{ answer?: string; choices?: { text: string }[] }> {
   const model = options?.model || "google/gemini-2.0-flash-001";
   const temperature = options?.temperature ?? 0.7;
   const maxTokens = options?.maxTokens ?? 4096;
   const systemPrompt =
      options?.systemPrompt ||
      "Você é um especialista em análise de marcas e produtos. Responda sempre em markdown detalhado.";
   const apiKey = env.OPENROUTER_API_KEY;
   if (!apiKey) throw new Error("OpenRouter API key not set");
   const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
         },
         body: JSON.stringify({
            model,
            messages: [
               { role: "system", content: systemPrompt },
               { role: "user", content: prompt },
            ],
            max_tokens: maxTokens,
            temperature,
         }),
      },
   );
   if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
   }
   const data = await response.json();
   const answer = data.choices?.[0]?.message?.content || "";
   return { answer, choices: [{ text: answer }] };
   // End of allLLM function
}
export async function extractBrandKnowledgeFromWebsite(
   agentId: string,
   websiteUrl: string,
) {
   // Step 1: Fetch website content using Tavily (if available)
   const contentResult = await tavilyWebSearch(websiteUrl, {
      maxResults: 1,
      includeAnswer: false,
      searchDepth: "advanced",
      topic: "general",
   });
   const mainContent = contentResult.results?.[0]?.content || "";

   // Step 2: Pass the extracted text to your LLM for chunking (OpenAI, Together, etc.)
   const llmPrompt = `You are an expert in brand and product analysis. You will receive the main content of a website and must generate exactly two highly detailed, well-structured markdown documents, separated by a clear delimiter (---):

1. About the app/brand: Deeply explain what it is, its purpose, how it works, target audience, impact, philosophy, differentiators, market context, vision, mission, values, history, and any other relevant information. Use rich sections, subtitles, examples, and clear language.

2. About products/services: Describe in detail all products and services, features, differentiators, plans, technology, application types, support, integrations, use cases, and any technical or commercial detail. Structure with sections, lists, tables, examples, and subtitles.

Website content:
${mainContent}

Output ONLY the two markdown documents, separated by '---'. Do NOT include any introductory text, commentary, or explanation before, after, or between the markdown documents. The output must start with the first markdown document and end with the second markdown document.`;
   const llmResult = await allLLM({ prompt: llmPrompt }); // Use allLLM for OpenRouter Gemini
   const llmAnswer = llmResult.answer || llmResult.choices?.[0]?.text || "";

   // Parse only the markdown content between delimiters
   // Remove any text before the first markdown doc and after the last
   const docs = llmAnswer
      .split(/---+/)
      .map((doc) => doc.trim())
      .filter((doc) => doc.length > 0);

   const now = new Date().toISOString();
   // Fetch current uploadedFiles using Drizzle ORM
   const agentRecord = await db.query.agent.findFirst({
      where: eq(agentTable.id, agentId),
   });
   const uploadedFiles = Array.isArray(agentRecord?.uploadedFiles)
      ? [...agentRecord.uploadedFiles]
      : [];

   // Helper to upload and enqueue
   async function uploadAndEnqueue(
      fileName: string,
      content: string,
      category: string,
   ) {
      const buffer = Buffer.from(content.trim(), "utf-8");
      const fileUrl = await uploadFile(fileName, buffer, "text/markdown");
      uploadedFiles.push({
         fileName,
         fileUrl,
         uploadedAt: now,
      });
      await distillQueue.add("distill-knowledge", {
         agentId,
         rawText: buffer.toString("utf-8"),
         source: "brand_knowledge",
         sourceType: "text/markdown",
         sourceIdentifier: fileUrl,
      });
   }

   if (docs.length >= 2 && docs[0] && docs[1]) {
      // Validate that each doc is sufficiently long and structured
      if (docs[0].length < 500 || docs[1].length < 500) {
         console.warn(
            "LLM output warning: One or both markdown docs are too short. Output:",
            docs,
         );
      }
      await uploadAndEnqueue("about-app.md", docs[0], "brand");
      await uploadAndEnqueue("products-services.md", docs[1], "product");
      await db
         .update(agentTable)
         .set({ uploadedFiles })
         .where(eq(agentTable.id, agentId));
   } else {
      console.warn(
         "LLM output warning: Did not receive two markdown docs. Output:",
         llmAnswer,
      );
      await uploadAndEnqueue("brand-website.md", llmAnswer, "brand");
      await db
         .update(agentTable)
         .set({ uploadedFiles })
         .where(eq(agentTable.id, agentId));
   }
}
