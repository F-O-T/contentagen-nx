import { createWorkflow, createStep } from "@mastra/core/workflows";
import { getPaymentClient } from "@packages/payment/client";
import {
   createAiUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { documentSynthesizerAgent } from "../agents/document-syntethizer-agent";
import { documentGenerationAgent } from "../agents/document-generation-agent";
import { MDocument } from "@mastra/rag";
import { uploadFile, getMinioClient } from "@packages/files/client";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateAgent } from "@packages/database/repositories/agent-repository";
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import {
   emitAgentKnowledgeStatusChanged,
   emitCompetitorAnalysisStatusChanged,
} from "@packages/server-events";
import { getChromaClient } from "@packages/chroma-db/client";
import { getCollection, addToCollection } from "@packages/chroma-db/helpers";
import crypto from "node:crypto";
import { z } from "zod";
import type { BrandKnowledgeStatus } from "@packages/database/schemas/agent";

type LLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

async function ingestUsage(usage: LLMUsage, userId: string) {
   const paymentClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
   const usageMetadata = createAiUsageMetadata({
      effort: "small",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
   });
   await ingestBilling(paymentClient, {
      externalCustomerId: userId,
      metadata: usageMetadata,
   });
}
// Helper function to update agent status and emit server events
async function updateAgentKnowledgeStatus(
   agentId: string,
   status: BrandKnowledgeStatus,
   message?: string,
) {
   try {
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      await updateAgent(db, agentId, { brandKnowledgeStatus: status });
   } catch (err) {
      // If DB update fails, still emit event so UI can update
      console.error(
         "[BrandKnowledge] Failed to update agent status in DB:",
         err,
      );
   }
   emitAgentKnowledgeStatusChanged({ agentId, status, message });
}

// Input schema for the workflow
export const CreateBrandKnowledgeInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   id: z.string(),
   target: z.enum(["brand", "competitor"]),
});

// Output schema for the workflow
export const CreateBrandKnowledgeOutput = z.object({
   chunkCount: z.number(),
});

const createBrandDocumentsOutputSchema = CreateBrandKnowledgeInput.extend({
   generatedDocuments: z
      .array(
         z.object({
            type: z.string().describe("Document type"),
            content: z
               .string()
               .describe(
                  "Complete document content in perfect markdown format",
               ),
            title: z.string().describe("Document title"),
         }),
      )
      .length(5)
      .describe("Exactly 5 business documents generated from brand analysis"),
});
const getFullBrandAnalysisOutputSchema = CreateBrandKnowledgeInput.extend({
   fullBrandAnalysis: z
      .string()
      .describe("Complete brand analysis document in perfect markdown format"),
});
const getFullBrandAnalysis = createStep({
   id: "get-full-brand-analysis-step",
   description: "Get full brand analysis",
   inputSchema: CreateBrandKnowledgeInput,
   outputSchema: getFullBrandAnalysisOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, id, target } = inputData;

      await updateAgentKnowledgeStatus(
         id,
         "analyzing",
         "Analyzing brand website and gathering information",
      );
      const inputPrompt = `
Help me with my business brand analysis.
websiteUrl: ${websiteUrl}
userId: ${userId}

 Requirements:
- Use the tavilyCrawlTool to analyze the website content
- Use tavilySearchTool to fill any information gaps
- Generate a complete brand analysis in perfect markdown format
- Include all sections: company foundation, business model, products, market positioning, credentials, digital presence, and strategic insights
- Extract specific details, metrics, and concrete information
- Maintain professional analysis throughout

Return the complete analysis as a well-structured markdown document.
`;
      const result = await documentSynthesizerAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: getFullBrandAnalysisOutputSchema.pick({
               fullBrandAnalysis: true,
            }),
         },
      );
      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to generate brand analysis: documentSynthesizerAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { fullBrandAnalysis } = result.object;
      await updateAgentKnowledgeStatus(
         id,
         "analyzing",
         "Brand website analysis completed",
      );

      return {
         fullBrandAnalysis,
         userId,
         websiteUrl,
         id,
         target,
      };
   },
});

const createBrandDocuments = createStep({
   id: "create-brand-documents-step",
   description: "Create brand documents",
   inputSchema: getFullBrandAnalysisOutputSchema,
   outputSchema: createBrandDocumentsOutputSchema,
   execute: async ({ inputData }) => {
      const { fullBrandAnalysis, userId, id, target, websiteUrl } = inputData;

      // Update status to chunking (preparing documents)
      await updateAgentKnowledgeStatus(
         id,
         "chunking",
         "Creating business documents from brand analysis",
      );
      const inputPrompt = `
Generate 5 distinct business documents from this brand analysis:

${fullBrandAnalysis}

Requirements:
- Generate exactly 5 documents: Brand Identity Profile, Product/Service Catalog, Market Presence Report, Customer Base Analysis, and Brand Assets Inventory
- Each document must be comprehensive, actionable, and in perfect markdown format
- Base all recommendations on the provided brand analysis data
- Include specific metrics, timelines, and implementation details
- Maintain consistency across all documents
- Use professional business language

Return the documents in the specified structured format.
`;

      const result = await documentGenerationAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: createBrandDocumentsOutputSchema,
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to generate brand documents: documentGenerationAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { generatedDocuments } = result.object;
      return {
         generatedDocuments,
         userId,
         websiteUrl,
         id,
         target,
      };
   },
});

const saveAndIndexBrandDocuments = createStep({
   id: "save-and-index-brand-documents-step",
   description: "Save documents to MinIO, database, and Chroma",
   inputSchema: createBrandDocumentsOutputSchema,
   outputSchema: CreateBrandKnowledgeOutput,
   execute: async ({ inputData }) => {
      const { generatedDocuments, id, target, websiteUrl } = inputData;

      // Update status to chunking (processing and indexing)
      await updateAgentKnowledgeStatus(
         id,
         "chunking",
         "Processing and indexing documents",
      );

      type UploadedFile = {
         fileName: string;
         fileUrl: string;
         uploadedAt: string;
         rawContent: string;
      };

      type ChunkItem = {
         text: string;
         agentId: string;
         sourceId: string;
      };

      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const minioClient = getMinioClient(serverEnv);
      const chroma = getChromaClient();
      const bucketName = serverEnv.MINIO_BUCKET;

      // Process documents sequentially to keep resource usage predictable.
      const uploadedFiles: UploadedFile[] = [];
      const allChunks: ChunkItem[] = [];

      // Helper function to sanitize document type for safe filenames
      const sanitizeDocumentType = (type: string): string => {
         return type
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
      };

      // Determine the target ID based on the target type
      const targetId = target === "brand" ? id : id;
      const targetPrefix = target === "brand" ? "brand" : "competitor";

      for (let docIndex = 0; docIndex < generatedDocuments.length; docIndex++) {
         const document = generatedDocuments[docIndex];
         const sanitizedType = sanitizeDocumentType(
            document?.type || "document",
         );
         const fileName = `${targetPrefix}-doc-${docIndex + 1}-${sanitizedType}.md`;
         const key = `${targetId}/${fileName}`;

         try {
            if (!document) continue;
            const fileBuffer = Buffer.from(document.content, "utf-8");

            // Upload file first, then chunk the content sequentially.
            await uploadFile(
               key,
               fileBuffer,
               "text/markdown",
               bucketName,
               minioClient,
            );

            const doc = MDocument.fromMarkdown(document.content);
            const chunks = await doc.chunk({
               strategy: "semantic-markdown",
               maxSize: 256,
               overlap: 50,
            });

            const uploadedFile: UploadedFile = {
               fileName,
               fileUrl: key,
               uploadedAt: new Date().toISOString(),
               rawContent: document.content,
            };

            const chunkItems: ChunkItem[] = chunks.map((c) => ({
               text: c.text,
               agentId: targetId,
               sourceId: key,
            }));

            uploadedFiles.push(uploadedFile);
            allChunks.push(...chunkItems);

            console.log(
               `[saveAndIndexBrandDocuments] Created ${chunkItems.length} chunks for document ${fileName}`,
            );
         } catch (error) {
            console.error(
               `[saveAndIndexBrandDocuments] Error processing document ${fileName}:`,
               error,
            );
            throw error;
         }
      }

      // Persist uploaded file metadata based on target type
      const filesForDb = uploadedFiles.map(({ rawContent, ...rest }) => rest);

      if (target === "brand") {
         await updateAgent(db, targetId, { uploadedFiles: filesForDb });
      } else {
         // For competitors, update the competitor record
         await updateCompetitor(db, targetId, { uploadedFiles: filesForDb });
      }

      if (allChunks.length > 0) {
         try {
            const collection = await getCollection(
               chroma,
               target === "brand" ? "AgentKnowledge" : "CompetitorKnowledge",
            );

            const documents = allChunks.map((item) => item.text);
            const ids = allChunks.map(() => crypto.randomUUID());
            const metadatas = allChunks.map((item) => ({
               ...(target === "brand"
                  ? { agentId: item.agentId }
                  : { competitorId: item.agentId }),
               sourceType:
                  target === "brand" ? "brand_document" : "competitor_document",
               sourceId: item.sourceId,
               websiteUrl,
            }));

            await addToCollection(collection, {
               documents,
               ids,
               metadatas,
            });

            console.log(
               `[saveAndIndexBrandDocuments] Successfully indexed ${allChunks.length} chunks to Chroma`,
            );
         } catch (error) {
            console.error(
               "[saveAndIndexBrandDocuments] Error saving chunks to Chroma:",
               error,
            );
            throw error;
         }
      }

      // Update status to completed based on target type
      if (target === "brand") {
         await updateAgentKnowledgeStatus(
            targetId,
            "completed",
            `Successfully processed ${allChunks.length} document chunks`,
         );
      } else {
         // For competitors, emit competitor status update
         emitCompetitorAnalysisStatusChanged({
            competitorId: targetId,
            status: "completed",
         });
      }

      return {
         chunkCount: allChunks.length,
      };
   },
});

export const createBrandKnowledgeWorkflow = createWorkflow({
   id: "create-brand-knowledge-and-index-documents",
   description: "Create brand knowledge and index documents",
   inputSchema: CreateBrandKnowledgeInput,
   outputSchema: CreateBrandKnowledgeOutput,
})
   .then(getFullBrandAnalysis)
   .then(createBrandDocuments)
   .then(saveAndIndexBrandDocuments)
   .commit();
