import { createChromaClient } from "@packages/chroma-db/client";
import {
   addToCollection,
   createCollection,
   getCollection,
} from "@packages/chroma-db/helpers";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import {
   buildExtractionPrompt,
   buildFormattingPrompt,
} from "@packages/prompts";
import { logger, task } from "@trigger.dev/sdk/v3";
import type { KnowledgePoint } from "@packages/chroma-db/src/knowledge-point-schema";
import { InvalidInputError } from "@packages/errors";

// Improved chunkText: splits by paragraphs, then sentences, with overlap
function chunkText(text: string, maxLength = 2000, overlap = 200): string[] {
   if (text.length <= maxLength) return [text];
   const paragraphs = text.split(/\n{2,}/);
   const chunks: string[] = [];
   let current = "";
   for (const para of paragraphs) {
      if ((current + para).length > maxLength) {
         if (current) chunks.push(current.trim());
         current = para;
      } else {
         current += (current ? "\n\n" : "") + para;
      }
   }
   if (current) chunks.push(current.trim());
   // Add overlap
   const overlapped: string[] = [];
   for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      if (i > 0 && overlap > 0) {
         const prev = chunks[i - 1];
         chunk = prev.slice(-overlap) + "\n" + chunk;
      }
      overlapped.push(chunk);
   }
   return overlapped;
}

// Robust JSON parsing for LLM output
function parseJSONWithFallbacks(jsonString: string): any {
   const strategies = [
      (str: string) => JSON.parse(str),
      (str: string) => JSON.parse(str.replace(/^[^{[]+/, "")),
      (str: string) => JSON.parse(str.replace(/,[\s\n\r]*([\]}])/g, "$1")),
      (str: string) => JSON.parse(str.replace(/'/g, '"')),
      (str: string) => {
         const match =
            str.match(
               /```(?:json)?\\s*(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\})\\s*```/,
            ) || str.match(/(\\[[\\s\\S]*?\\]|\\{[\\s\\S]*?\\})/);
         return match ? JSON.parse(match[1] ?? "") : null;
      },
   ];
   for (const strategy of strategies) {
      try {
         const result = strategy(jsonString);
         if (result) return result;
      } catch {}
   }
   throw new InvalidInputError("All JSON parsing strategies failed");
}

// Validate and filter knowledge points
function validateKnowledgePoints(result: any): KnowledgePoint[] {
   let points: KnowledgePoint[] = [];
   if (Array.isArray(result)) {
      points = result as KnowledgePoint[];
   } else if (
      typeof result === "object" &&
      result !== null &&
      "content" in result &&
      "summary" in result
   ) {
      points = [result as KnowledgePoint];
   } else {
      throw new InvalidInputError(
         "Invalid result format - expected array or object with content and summary",
      );
   }
   return points.filter(
      (point) =>
         point.content &&
         point.summary &&
         typeof point.content === "string" &&
         point.content.length >= 50,
   );
}

// Types for the distillation process
interface DistillationInput {
   agentId: string;
   rawText: string;
   sourceType: string;
   sourceIdentifier?: string;
}

// Accepts OpenRouter client as a parameter
export const knowledgeDistillationTask = task({
   id: "knowledge-distillation",
   maxDuration: 600, // 10 minutes
   // Accepts OpenRouter client as a parameter
   run: async (payload: DistillationInput & { openrouterClient: any }) => {
      logger.log("Starting knowledge distillation", { payload });

      logger.log("Chunking raw text for processing");
      const chunks = chunkText(payload.rawText);

      // === 2. Extraction ===
      logger.log("Extracting knowledge points from text chunks");
      const client = payload.openrouterClient;
      const extractedChunks: string[] = [];
      for (const chunk of chunks) {
         const extractionPrompt = buildExtractionPrompt(
            chunk,
            payload.sourceType,
         );
         const response = await generateOpenRouterText(client, [
            {
               prompt: extractionPrompt,
               maxTokens: 2000,
               temperature: 0.3,
               model: "moonshotai/kimi-k2",
            },
         ]);
         const content = response?.text?.trim?.() || "";
         if (content.length >= 50) extractedChunks.push(content);
      }
      if (extractedChunks.length === 0)
         throw new InvalidInputError("No content extracted");

      logger.log("Knowledge points extracted", {
         count: extractedChunks.length,
      });

      // === 3. Formatting ===
      const formattingPrompt = buildFormattingPrompt(
         payload.sourceType,
         extractedChunks.join("\n\n"),
      );

      logger.log("Formatting extracted knowledge points");
      const formattingResponse = await generateOpenRouterText(client, [
         {
            prompt: formattingPrompt,
            maxTokens: 3000,
            temperature: 0.1,
            model: "moonshotai/kimi-k2",
         },
      ]);
      const jsonText = formattingResponse?.text?.trim?.() || "";

      // === 4. Validation ===
      logger.log("Validating and parsing LLM output as JSON");
      let knowledgePoints: KnowledgePoint[] = [];
      try {
         const parsed = parseJSONWithFallbacks(jsonText);
         knowledgePoints = validateKnowledgePoints(parsed);
      } catch (e) {
         throw new InvalidInputError(
            "Failed to parse or validate LLM output as KnowledgePoints: " +
               (e instanceof Error ? e.message : String(e)),
         );
      }

      const formattingInput = extractedChunks.join("\n\n");

      logger.log("Formatting extracted knowledge points");
      const formattingResponse = await generateOpenRouterText(client, [
         {
            prompt:
               formattingPrompt +
               '\n\nKnowledgePoints:\n"""' +
               formattingInput +
               '"""',
            maxTokens: 3000,
            temperature: 0.1,
            model: "moonshotai/kimi-k2",
         },
      ]);
      const jsonText =
         formattingResponse?.text?.trim?.() ||
         formattingResponse?.choices?.[0]?.text?.trim?.() ||
         "";

      // === 4. Validation ===
      logger.log("Validating and parsing LLM output as JSON");
      let knowledgePoints: KnowledgePoint[] = [];
      try {
         knowledgePoints = JSON.parse(jsonText);
         if (!Array.isArray(knowledgePoints))
            knowledgePoints = [knowledgePoints];
      } catch (e) {
         throw new Error(
            "Failed to parse LLM output as JSON: " +
               (e instanceof Error ? e.message : String(e)),
         );
      }
      knowledgePoints = knowledgePoints.filter(
         (kp) => kp.content && kp.summary && kp.content.length >= 50,
      );

      // === 5. Chroma DB Storage ===
      logger.log("Storing knowledge points in Chroma DB", {
         count: knowledgePoints.length,
      });
      const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
      const chromaClient = createChromaClient(chromaUrl);
      const collectionName = `knowledge_distillation_${payload.agentId}`;
      let collection;
      try {
         collection = await getCollection(chromaClient, collectionName);
      } catch {
         collection = await createCollection(chromaClient, {
            name: collectionName,
         });
      }
      await addToCollection(collection, {
         ids: knowledgePoints.map(
            (_, i) => `${payload.agentId}_${Date.now()}_${i}`,
         ),
         documents: knowledgePoints.map((kp) => kp.content),
         metadatas: knowledgePoints.map((kp) => {
            const meta: Record<string, string | number | boolean | null> = {
               ...kp,
               agentId: payload.agentId,
               sourceType: payload.sourceType,
            };
            if (kp.keywords) meta.keywords = kp.keywords.join(", ");
            return meta;
         }),
      });

      logger.log("Knowledge distillation complete and stored in Chroma DB", {
         count: knowledgePoints.length,
      });
      return { knowledgePoints };
   },
});
