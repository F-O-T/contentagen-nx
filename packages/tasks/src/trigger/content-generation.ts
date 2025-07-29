import { task, logger } from "@trigger.dev/sdk/v3";
import {
   getContentById,
   updateContent,
   listContents,
} from "@packages/database/repositories/content-repository";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import {
   createOpenrouterClient,
   type OpenRouterClient,
} from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { getChunkingPrompt } from "@packages/prompts/helpers/knowledge-distillation-helper";
import {
   createChromaClient,
   type ChromaClient,
} from "@packages/chroma-db/client";
import {
   getOrCreateCollection,
   queryCollection,
} from "@packages/chroma-db/helpers";
import { createTavilyClient, type TavilyClient } from "@packages/tavily/client";
import { tavilySearch } from "@packages/tavily/helpers";
import { generateSystemPrompt } from "@packages/prompts/helpers/agent-system-prompt-assembler";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
const openrouter: OpenRouterClient = createOpenrouterClient(
   serverEnv.OPENROUTER_API_KEY,
);

export type ContentGenerationPayload = {
   contentId: string;
   agentId: string;
};

export type PipelineContext = {
   content?: any;
   agent?: any;
   ragResults?: any;
   webSearchResults?: any;
   enrichedBrief?: any;
   generatedArticle?: any;
   factCheckResult?: any;
   finalArticle?: any;
   contentMeta?: any;
};

export async function runContentGenerationPipeline(
   payload: ContentGenerationPayload,
) {
   const { contentId, agentId } = payload;
   logger.info("Starting content generation pipeline", { contentId, agentId });

   // Initialize pipeline context
   const pipelineContext: PipelineContext = {};

   // Step 1: Fetch content and agent records
   pipelineContext.content = await getContentById(db, contentId);
   pipelineContext.agent = await getAgentById(db, agentId);
   if (!pipelineContext.content || !pipelineContext.agent) {
      throw new Error("Content or Agent not found");
   }

   // Step 1: Request Analysis & Knowledge Retrieval (RAG)
   logger.info("Step 1: Topic chunking and internal knowledge search", {
      contentId,
      agentId,
   });
   const description = pipelineContext.content.description;
   // 1. Topic chunking prompt
   const chunkingPrompt = getChunkingPrompt();
   const chunkingPromptText = chunkingPrompt.replace(
      "[INSERT YOUR TEXT HERE]",
      description,
   );
   const chunkingResult = await generateOpenRouterText(openrouter, {
      prompt: chunkingPromptText,
   });
   // Assume chunkingResult.text is a list of queries (split by newlines)
   const queries = chunkingResult.text
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

   // 2. Vector search in AgentKnowledge collection
   const chroma: ChromaClient = createChromaClient(serverEnv.CHROMA_DB_URL);
   const { collection } = await getOrCreateCollection(chroma, "AgentKnowledge");
   // Query for each chunk/query
   const ragResults: any[] = [];
   for (const query of queries) {
      const result = await queryCollection(collection, {
         queryTexts: [query],
         nResults: 5,
      });
      // Filter by agentId in metadata
      const filtered =
         result?.metadatas?.filter((m: any) => m.agentId === agentId) || [];
      ragResults.push(...filtered);
   }
   pipelineContext.ragResults = ragResults;

   // Step 2: Web Research & Source Curation
   logger.info("Step 2: Web research and source curation", {
      contentId,
      agentId,
   });
   const tavily: TavilyClient = createTavilyClient(serverEnv.TAVILY_API_KEY);
   // Generate a search query from the request description
   const webSearchQuery = description;
   const webSearchResults = await tavilySearch(tavily, webSearchQuery, {
      maxResults: 5,
      includeAnswer: true,
      searchDepth: "advanced",
      topic: "general",
   });
   pipelineContext.webSearchResults = webSearchResults;

   // Step 3: Description Enrichment & Synthesis
   logger.info("Step 3: Description enrichment and synthesis", {
      contentId,
      agentId,
   });
   const strategistPrompt = `You are a Content Strategist. Your job is to synthesize the following information into a comprehensive brief for a writer.\n\nOriginal Description:\n${description}\n\nInternal Knowledge (RAG Results):\n${JSON.stringify(pipelineContext.ragResults, null, 2)}\n\nWeb Research Results:\n${JSON.stringify(pipelineContext.webSearchResults, null, 2)}\n\nOutput a structured brief with key points, thesis, and recommended structure.`;
   const strategistResult = await generateOpenRouterText(openrouter, {
      prompt: strategistPrompt,
   });
   pipelineContext.enrichedBrief = strategistResult.text;

   // Step 4: Article Generation
   logger.info("Step 4: Article generation", { contentId, agentId });
   // Use agent.systemPrompt and enrichedBrief
   const systemPrompt = generateSystemPrompt(
      pipelineContext.agent.personaConfig,
   );
   const writerPrompt = `${systemPrompt}\n\nWrite a full article based on the following brief:\n${pipelineContext.enrichedBrief}`;
   const writerResult = await generateOpenRouterText(openrouter, {
      prompt: writerPrompt,
   });
   pipelineContext.generatedArticle = writerResult.text;

   // Step 5: Factual Verification with Live Web Search
   logger.info("Step 5: Factual verification with live web search", {
      contentId,
      agentId,
   });
   const factCheckerPrompt = `You are a Fact-Checker with access to live web search. Review the following article for factual accuracy. For each claim, verify it using web search and note any corrections needed.\n\nArticle:\n${pipelineContext.generatedArticle}\n\nOutput a JSON object: { "is_accurate": boolean, "corrections": [ { "claim": string, "correction": string } ] }`;
   const factCheckResultRaw = await generateOpenRouterText(openrouter, {
      prompt: factCheckerPrompt,
   });
   let factCheckResult;
   try {
      factCheckResult = JSON.parse(factCheckResultRaw.text);
   } catch (e) {
      logger.error("Failed to parse fact check JSON", {
         error: e,
         text: factCheckResultRaw.text,
      });
      throw new Error("Fact check failed: invalid format");
   }
   pipelineContext.factCheckResult = factCheckResult;

   // Step 6: Content Correction (Conditional)
   logger.info("Step 6: Content correction (conditional)", {
      contentId,
      agentId,
   });
   if (
      pipelineContext.factCheckResult &&
      pipelineContext.factCheckResult.is_accurate === false
   ) {
      const corrections = pipelineContext.factCheckResult.corrections || [];
      const editorPrompt = `You are an Editor. Apply the following factual corrections to the article below, preserving tone and style.\n\nArticle:\n${pipelineContext.generatedArticle}\n\nCorrections:\n${JSON.stringify(corrections, null, 2)}\n\nOutput the corrected article only.`;
      const editorResult = await generateOpenRouterText(openrouter, {
         prompt: editorPrompt,
      });
      pipelineContext.finalArticle = editorResult.text;
   } else {
      pipelineContext.finalArticle = pipelineContext.generatedArticle;
   }

   // Step 7: Metadata Generation & Internal Linking (Optimized)
   logger.info("Step 7: Metadata generation & internal linking", {
      contentId,
      agentId,
   });
   const personaConfig = pipelineContext.agent.personaConfig;
   let metaPrompt = `Generate a JSON object matching this schema: { slug: string, tags: string[], topics: string[], sources: string[] }. Use the article below as context.\n\nArticle:\n${pipelineContext.finalArticle}`;
   let blogPostsList = [];
   if (personaConfig.purpose === "blog_post") {
      // Fetch user's existing blog posts for internal linking
      const userId = pipelineContext.content.userId;
      const allContents = await listContents(db);
      blogPostsList = allContents
         .filter(
            (c: any) =>
               c.userId === userId &&
               c.status === "draft" &&
               c.id !== contentId,
         )
         .map((c: any) => ({ title: c.title, slug: c.meta?.slug || "" }));
      metaPrompt += `\n\nAlso, analyze the article for internal linking opportunities based on this list of existing blog posts:\n${JSON.stringify(blogPostsList, null, 2)}\n\nOutput a unified JSON: { metadata: {...}, bodyWithInternalLinks: "..." }`;
   }
   const metaResultRaw = await generateOpenRouterText(openrouter, {
      prompt: metaPrompt,
   });
   let metaResult;
   try {
      metaResult = JSON.parse(metaResultRaw.text);
   } catch (e) {
      logger.error("Failed to parse metadata/internal linking JSON", {
         error: e,
         text: metaResultRaw.text,
      });
      throw new Error("Metadata/internal linking failed: invalid format");
   }
   pipelineContext.contentMeta = metaResult.metadata || metaResult;
   if (metaResult.bodyWithInternalLinks) {
      pipelineContext.finalArticle = metaResult.bodyWithInternalLinks;
   }

   // Finalization: Update DB with final content, metadata, and stats
   logger.info("Finalization: updating content record", { contentId, agentId });
   // Calculate stats
   const wordsCount = pipelineContext.finalArticle.split(/\s+/).length;
   const readTimeMinutes = Math.ceil(wordsCount / 200); // ~200 wpm
   const stats = { wordsCount, readTimeMinutes };
   await updateContent(db, contentId, {
      body: pipelineContext.finalArticle,
      meta: pipelineContext.contentMeta,
      stats,
      status: "draft",
   });
   logger.info("Content generation pipeline complete", { contentId });
   return pipelineContext;
}

export const contentGenerationTask = task({
   id: "content-generation-pipeline",
   run: runContentGenerationPipeline,
});
