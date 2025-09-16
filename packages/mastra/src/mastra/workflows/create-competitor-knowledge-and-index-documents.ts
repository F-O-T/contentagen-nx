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
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import { emitCompetitorAnalysisStatusChanged } from "@packages/server-events";
import { getChromaClient } from "@packages/chroma-db/client";
import { getCollection, addToCollection } from "@packages/chroma-db/helpers";
import crypto from "node:crypto";
import { z } from "zod";
import type { CompetitorAnalysisStatus } from "@packages/database/schemas/competitor";

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
// Helper function to update competitor analysis status and emit server events
async function updateCompetitorAnalysisStatus(
   competitorId: string,
   status: CompetitorAnalysisStatus,
   message?: string,
) {
   try {
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      await updateCompetitor(db, competitorId, { analysisStatus: status });
   } catch (err) {
      // If DB update fails, still emit event so UI can update
      console.error(
         "[CompetitorAnalysis] Failed to update competitor analysis status in DB:",
         err,
      );
   }
   emitCompetitorAnalysisStatusChanged({ competitorId, status, message });
}

// Input schema for the workflow
export const CreateCompetitorKnowledgeInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   competitorId: z.string(),
});

// Output schema for the workflow
export const CreateCompetitorKnowledgeOutput = z.object({
   chunkCount: z.number(),
});

const createCompetitorDocumentsOutputSchema =
   CreateCompetitorKnowledgeInput.extend({
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
         .describe(
            "Exactly 5 business documents generated from brand analysis",
         ),
   });
const getFullCompetitorAnalysisOutputSchema =
   CreateCompetitorKnowledgeInput.extend({
      fullCompetitorAnalysis: z
         .string()
         .describe(
            "Complete brand analysis document in perfect markdown format",
         ),
   });
const getFullCompetitorAnalysis = createStep({
   id: "get-full-brand-analysis-step",
   description: "Get full competitor analysis",
   inputSchema: CreateCompetitorKnowledgeInput,
   outputSchema: getFullCompetitorAnalysisOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, competitorId } = inputData;

      await updateCompetitorAnalysisStatus(
         competitorId,
         "analyzing",
         "Analyzing competitor website and gathering information",
      );
      const inputPrompt = `
Help me with my competitor analysis.
websiteUrl: ${websiteUrl}
userId: ${userId}

Requirements:
- Use the tavilyCrawlTool to analyze the website content
- Use tavilySearchTool to fill any information gaps
- Generate a complete competitor analysis in perfect markdown format
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
            output: getFullCompetitorAnalysisOutputSchema.pick({
               fullCompetitorAnalysis: true,
            }),
         },
      );
      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to generate competitor analysis: documentSynthesizerAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { fullCompetitorAnalysis } = result.object;
      await updateCompetitorAnalysisStatus(
         competitorId,
         "analyzing",
         "Competitor website analysis completed",
      );

      return {
         fullCompetitorAnalysis,
         userId,
         websiteUrl,
         competitorId,
      };
   },
});

const createCompetitorDocuments = createStep({
   id: "create-brand-documents-step",
   description: "Create competitor documents",
   inputSchema: getFullCompetitorAnalysisOutputSchema,
   outputSchema: createCompetitorDocumentsOutputSchema,
   execute: async ({ inputData }) => {
      const { fullCompetitorAnalysis, userId, competitorId, websiteUrl } =
         inputData;

      // Update status to chunking (preparing documents)
      await updateCompetitorAnalysisStatus(
         competitorId,
         "chunking",
         "Creating business documents from competitor analysis",
      );
      const inputPrompt = `
Generate 5 distinct business documents from this competitor analysis:

${fullCompetitorAnalysis}

Requirements:
- Generate exactly 5 documents: Competitor Identity Profile, Product/Service Catalog, Market Presence Report, Customer Base Analysis, and Competitor Assets Inventory
- Each document must be comprehensive, actionable, and in perfect markdown format
- Base all recommendations on the provided competitor analysis data
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
            output: createCompetitorDocumentsOutputSchema.pick({
               generatedDocuments: true,
            }),
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to generate competitor documents: documentGenerationAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { generatedDocuments } = result.object;
      return {
         generatedDocuments,
         userId,
         websiteUrl,
         competitorId,
      };
   },
});

const saveAndIndexCompetitorDocuments = createStep({
   id: "save-and-index-brand-documents-step",
   description: "Save documents to MinIO, database, and Chroma",
   inputSchema: createCompetitorDocumentsOutputSchema,
   outputSchema: CreateCompetitorKnowledgeOutput,
   execute: async ({ inputData }) => {
      const { generatedDocuments, competitorId, websiteUrl } = inputData;

      // Update status to chunking (processing and indexing)
      await updateCompetitorAnalysisStatus(
         competitorId,
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
         competitorId: string;
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

      for (let docIndex = 0; docIndex < generatedDocuments.length; docIndex++) {
         const document = generatedDocuments[docIndex];
         const sanitizedType = sanitizeDocumentType(
            document?.type || "document",
         );
         const fileName = `competitor-doc-${docIndex + 1}-${sanitizedType}.md`;
         const key = `${competitorId}/${fileName};`;

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
               competitorId,
               sourceId: key,
            }));

            uploadedFiles.push(uploadedFile);
            allChunks.push(...chunkItems);

            console.log(
               `[saveAndIndexCompetitorDocuments] Created ${chunkItems.length} chunks for document ${fileName}`,
            );
         } catch (error) {
            console.error(
               `[saveAndIndexCompetitorDocuments] Error processing document ${fileName}:`,
               error,
            );
            throw error;
         }
      }

      // Persist uploaded file metadata (without raw content) to the competitor record
      const filesForDb = uploadedFiles.map(({ rawContent, ...rest }) => rest);
      await updateCompetitor(db, competitorId, { uploadedFiles: filesForDb });

      if (allChunks.length > 0) {
         try {
            const collection = await getCollection(
               chroma,
               "CompetitorKnowledge",
            );

            const documents = allChunks.map((item) => item.text);
            const ids = allChunks.map(() => crypto.randomUUID());
            const metadatas = allChunks.map((item) => ({
               competitorId: item.competitorId,
               sourceType: "competitor_knowledge",
               sourceId: item.sourceId,
               websiteUrl,
            }));

            await addToCollection(collection, {
               documents,
               ids,
               metadatas,
            });

            console.log(
               `[saveAndIndexCompetitorDocuments] Successfully indexed ${allChunks.length} chunks to Chroma`,
            );
         } catch (error) {
            console.error(
               "[saveAndIndexCompetitorDocuments] Error saving chunks to Chroma:",
               error,
            );
            throw error;
         }
      }

      // Update status to completed
      await updateCompetitorAnalysisStatus(
         competitorId,
         "completed",
         `Successfully processed ${allChunks.length} document chunks`,
      );

      return {
         chunkCount: allChunks.length,
      };
   },
});

export const createCompetitorKnowledgeWorkflow = createWorkflow({
   id: "create-competitor-knowledge-and-index-documents",
   description: "Create competitor knowledge and index documents",
   inputSchema: CreateCompetitorKnowledgeInput,
   outputSchema: CreateCompetitorKnowledgeOutput,
})
   .then(getFullCompetitorAnalysis)
   .then(createCompetitorDocuments)
   .then(saveAndIndexCompetitorDocuments)
   .commit();
