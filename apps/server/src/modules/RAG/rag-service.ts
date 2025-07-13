import { eq } from "drizzle-orm";
import { agent as agentTable } from "../../schemas/agent-schema";
import type { KnowledgeSource } from "@api/schemas/agent-schema";
import { tavily } from "@tavily/core";
import { generateEmbedding } from "./rag-utils";
import { findChunksBySource } from "./rag-repository";
import { env } from "@api/config/env";
import { db } from "@api/integrations/database";
import { knowledgeChunk } from "../../schemas/agent-schema";

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
   const llmPrompt = `Você é um especialista em análise de marcas e produtos. Receba o conteúdo principal do site abaixo e gere dois documentos em markdown, altamente detalhados e estruturados:\n\n1. Sobre o aplicativo/marca: explique profundamente o que é, proposta, funcionamento, público-alvo, impacto, filosofia, diferenciais, contexto de mercado, visão, missão, valores, história, e qualquer informação relevante. Use seções e subtítulos ricos, exemplos, e linguagem clara.\n\n2. Sobre produtos/serviços: descreva minuciosamente todos os produtos e serviços, funcionalidades, diferenciais, planos, tecnologia, tipos de aplicação, suporte, integrações, casos de uso, e qualquer detalhe técnico ou comercial relevante. Estruture com seções, listas, tabelas, exemplos e subtítulos.\n\nConteúdo do site:\n\n${mainContent}\n\nCada documento deve ser completo, informativo, com markdown avançado, seções, subtítulos, listas, tabelas e exemplos. Separe os dois documentos com um delimitador claro como '---'.`;
   const llmResult = await allLLM({ prompt: llmPrompt }); // Use allLLM for OpenRouter Gemini
   const llmAnswer = llmResult.answer || llmResult.choices?.[0]?.text || "";

   if (llmAnswer) {
      // Try to split the answer into two markdown docs
      const docs = llmAnswer.split(/^# /gm).filter(Boolean);
      const now = new Date().toISOString();
      // Fetch current uploadedFiles using Drizzle ORM
      const agentRecord = await db.query.agent.findFirst({
         where: eq(agentTable.id, agentId),
      });
      const uploadedFiles = Array.isArray(agentRecord?.uploadedFiles)
         ? [...agentRecord.uploadedFiles]
         : [];
      if (docs.length >= 2 && docs[0] && docs[1]) {
         // First doc: about the app
         await db.insert(knowledgeChunk).values({
            agentId,
            content: `# ${docs[0].trim()}`,
            summary: docs[0].slice(0, 200),
            category: "brand",
            keywords: [websiteUrl],
            source: "brand_knowledge",
         });
         uploadedFiles.push({
            fileName: "about-app.md",
            fileUrl: "virtual",
            uploadedAt: now,
         });

         // Second doc: products/services
         await db.insert(knowledgeChunk).values({
            agentId,
            content: `# ${docs[1].trim()}`,
            summary: docs[1].slice(0, 200),
            category: "product",
            keywords: [websiteUrl],
            source: "brand_knowledge",
         });
         uploadedFiles.push({
            fileName: "products-services.md",
            fileUrl: "virtual",
            uploadedAt: now,
         });

         await db
            .update(agentTable)
            .set({ uploadedFiles })
            .where(eq(agentTable.id, agentId));
      } else {
         // Fallback: save the whole answer as a single chunk and file
         await db.insert(knowledgeChunk).values({
            agentId,
            content: llmAnswer,
            summary: llmAnswer.slice(0, 200),
            category: "brand",
            keywords: [websiteUrl],
            source: "brand_knowledge",
         });
         uploadedFiles.push({
            fileName: "brand-website.md",
            fileUrl: "virtual",
            uploadedAt: now,
         });
         await db
            .update(agentTable)
            .set({ uploadedFiles })
            .where(eq(agentTable.id, agentId));
      }
   }
}
