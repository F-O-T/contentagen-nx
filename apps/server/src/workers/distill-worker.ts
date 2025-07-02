export type KnowledgePoint = {
   summary: string;
   category?: string;
   keywords?: string[];
   source?: string;
   source_type?: string;
   source_identifier?: string;
   content: string;
};

function buildExtractionPrompt(rawText: string, sourceType: string): string {
   return `You are the Synthesizer Agent. Your mission is to extract the most valuable, nuanced, and context-rich KnowledgePoints from the provided raw text. A KnowledgePoint is a self-contained, actionable, and insightful fact, directive, or concept that can stand alone as a meaningful semantic unit. For each KnowledgePoint, output:
- content: A deeply distilled, human-readable synthesis of the raw text, capturing subtlety, nuance, and practical implications. Avoid verbatim copying; instead, rephrase and enrich the idea to maximize clarity, depth, and usefulness. Include relevant context, examples, or implications where appropriate.
- summary: A concise 1–2 sentence summary that captures the core insight, significance, or actionable takeaway of the KnowledgePoint.
- source: Explicitly tag the source type ('uploaded_file' or 'approved_generated_content').

Guidelines:
- Do NOT include category, keywords, or JSON formatting.
- Output ONLY a plain, numbered list of KnowledgePoints in natural language, one per line or paragraph.
- Each KnowledgePoint should be as rich, nuanced, and informative as possible, not superficial or generic.
- If the text contains ambiguity or multiple interpretations, clarify or expand as needed.

Raw Input:
"""${rawText}"""
Source: ${sourceType}
`;
}

function buildFormattingPrompt(extractedChunks: string): string {
   return `You are the Chunking & Metadata Agent. Your task is to transform the provided KnowledgePoints into structured 'knowledge_chunk' objects with maximum semantic richness and metadata precision. For each KnowledgePoint, generate:
- category: Classify into 'brand_guideline', 'product_spec', 'market_insight', 'technical_instruction', or 'custom' (choose the most specific and meaningful category).
- keywords: Extract 3–5 highly specific, semantically relevant tags (avoid generic or overly broad terms; focus on unique concepts, entities, or actionable themes).
- source: Confirm the source type ('uploaded_file' or 'approved_generated_content').

STRICT OUTPUT INSTRUCTIONS:
- Output ONLY a JSON array of knowledge_chunk objects, even if there is only one object.
- DO NOT output a single object. Always wrap the result in an array, e.g. [ {...} ]
- Do NOT include any text, markdown, or code fences before or after the JSON array.
- The output MUST be valid JSON, parsable by JSON.parse in JavaScript.

EXAMPLE (single object):
[
  {
    "content": "Greetings are the first step in any interaction, setting the tone for conversations and reflecting cultural awareness, creativity, and connection.",
    "summary": "Greetings are essential in initiating interactions and conveying cultural sensitivity and personal expression.",
    "category": "brand_guideline",
    "keywords": ["cultural awareness", "communication", "interaction", "connection"],
    "source": "uploaded_file"
  }
]

COMMON MISTAKES TO AVOID:
- Do NOT output a single object. Always use an array, even for one item.
- Do NOT include any explanation, markdown, or extra text.
- Ensure all fields are as rich, specific, and contextually meaningful as possible.

KnowledgePoints:
"""${extractedChunks}"""
`;
}

async function runStep1Extraction(
   rawText: string,
   sourceType: string,
): Promise<string> {
   const prompt = buildExtractionPrompt(rawText, sourceType);
   const response = await openRouter.chat.completions.create({
      model: "qwen/qwen3-30b-a3b-04-28",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "text" },
   });
   const extracted = response.choices[0]?.message?.content;
   if (!extracted) throw new Error("No extraction output from model");
   return extracted.trim();
}

async function runStep2Formatting(
   extractedChunks: string,
): Promise<KnowledgePoint[]> {
   const prompt = buildFormattingPrompt(extractedChunks);
   const response = await openRouter.chat.completions.create({
      model: "qwen/qwen3-30b-a3b-04-28",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
   });
   const generated = response.choices[0]?.message?.content;
   if (!generated) throw new Error("No formatting output from model");
   // Log the raw output for debugging
   console.error("Raw formatting model output:", generated);
   try {
      const result = JSON.parse(generated);
      if (Array.isArray(result)) {
         return result;
      } else if (typeof result === "object" && result !== null) {
         // Accept a single object and wrap in array
         return [result];
      } else {
         throw new Error("Expected a JSON array or object of knowledge_chunk");
      }
   } catch {
      // Try to fix common JSON issues
      const cleaned = generated
         .replace(/^[^{[]+/, "") // Remove text before JSON
         .replace(/,[\s\n\r]*([\]}])/g, "$1") // Remove trailing commas
         .replace(/'/g, '"'); // Replace single quotes with double quotes
      try {
         const result = JSON.parse(cleaned);
         if (Array.isArray(result)) {
            return result;
         } else if (typeof result === "object" && result !== null) {
            return [result];
         } else {
            throw new Error(
               "Expected a JSON array or object of knowledge_chunk",
            );
         }
      } catch {
         console.error(
            "Failed to parse JSON from formatting model after cleaning.",
         );
         console.error("Cleaned output:", cleaned);
         throw new Error("Invalid JSON response from formatting model");
      }
   }
}

async function generateDistilledKnowledge(
   rawText: string,
   sourceType: string,
): Promise<KnowledgePoint[]> {
   // Step 1: Extract atomic KnowledgePoints as plain text
   const extracted = await runStep1Extraction(rawText, sourceType);
   // Step 2: Format into strict JSON knowledge_chunk objects
   const formatted = await runStep2Formatting(extracted);
   return formatted;
}

import { Queue, Worker } from "bullmq";
import { db } from "../integrations/database";
import { openRouter } from "../integrations/openrouter";
import { knowledgeChunk } from "../schemas/agent-schema";
import { redis } from "../services/redis";
import { embeddingService } from "../services/embedding";

export const distillQueue = new Queue("distill-knowledge", {
   connection: redis,
});

distillQueue.on("error", (err) => {
   console.error("Distill queue error:", err);
});

export const distillWorker = new Worker(
   "distill-knowledge",
   async (job) => {
      const { agentId, rawText, source, sourceType, sourceIdentifier } =
         job.data;
      job.log(`Distilling knowledge for agent: ${agentId}`);
      try {
         // Run the two-step LLM distillation
         const knowledgePoints = await generateDistilledKnowledge(
            rawText,
            sourceType,
         );
         job.log(`Model returned ${knowledgePoints.length} knowledge points.`);
         let savedChunks = 0;
         for (const kp of knowledgePoints) {
            // Defensive: ensure required fields
            if (!kp.content || !kp.summary) continue;
            let embedding: number[] | undefined;
            try {
               embedding = await embeddingService.generateFileContentEmbedding(
                  kp.content,
               );
            } catch {
               job.log(`Embedding generation failed for chunk: ${kp.summary}`);
            }
            await db.insert(knowledgeChunk).values({
               agentId,
               content: kp.content,
               summary: kp.summary,
               category: kp.category,
               keywords: kp.keywords,
               source: kp.source || source,
               sourceType: kp.source_type || sourceType,
               sourceIdentifier: kp.source_identifier || sourceIdentifier,
               embedding,
            });
            savedChunks++;
         }
         job.log(`Saved ${savedChunks} knowledge chunks to DB.`);
         return { success: true, agentId, savedChunks };
      } catch (error) {
         const errorMsg = `Failed to distill knowledge for agent: ${agentId}`;
         job.log(
            `ERROR: ${errorMsg} - ${error instanceof Error ? error.message : String(error)}`,
         );
         throw new Error(
            `${errorMsg}: ${error instanceof Error ? error.message : String(error)}`,
         );
      }
   },
   { connection: redis, concurrency: 10 },
);

distillWorker.on("error", (err) => {
   console.error("Distill worker error:", err);
});

async function gracefulShutdown(signal: string) {
   console.log(`Received ${signal}, closing distill worker...`);
   await distillWorker.close();
   process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
