import { createWorkflow, createStep } from "@mastra/core/workflows";
import { createBrandKnowledgeWithEmbedding } from "@packages/rag/repositories/brand-knowledge-repository";
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
import { z } from "zod";
import { createPgVector } from "@packages/rag/client";
import { createCompetitorKnowledgeWithEmbedding } from "@packages/rag/repositories/competitor-knowledge-repository";
import { AppError, propagateError } from "@packages/utils/errors";

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
      effort: "deepseek-v3.1-terminus",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
   });
   await ingestBilling(paymentClient, {
      externalCustomerId: userId,
      metadata: usageMetadata,
   });
}

// Unified helper function to handle status updates for both targets

async function updateTargetUploadedFiles(
   targetId: string,
   target: "brand" | "competitor",
   uploadedFiles: { fileName: string; fileUrl: string; uploadedAt: string }[],
) {
   const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

   if (target === "brand") {
      return;
   } else {
      await updateCompetitor(db, targetId, { uploadedFiles });
   }
}

function sanitizeDocumentType(type: string): string {
   return type
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Helper function to build and upload a single document
async function buildAndUploadDocument({
   document,
   documentIndex,
   targetId,
   target,
   bucketName,
   minioClient,
}: {
   document: { type: string; content: string; title: string };
   documentIndex: number;
   targetId: string;
   target: "brand" | "competitor";
   bucketName: string;
   minioClient: ReturnType<typeof getMinioClient>;
}) {
   const targetPrefix = target === "brand" ? "brand" : "competitor";
   const sanitizedType = sanitizeDocumentType(document?.type || "document");
   const fileName = `${targetPrefix}-doc-${documentIndex + 1}-${sanitizedType}.md`;
   const key = `${targetId}/${fileName}`;

   // Create file buffer and upload to MinIO
   const fileBuffer = Buffer.from(document.content, "utf-8");
   await uploadFile(key, fileBuffer, "text/markdown", bucketName, minioClient);

   // Create document and chunks
   const doc = MDocument.fromMarkdown(document.content);
   const chunks = await doc.chunk({
      strategy: "semantic-markdown",
      maxSize: 256,
      overlap: 50,
   });

   // Return structured data
   return {
      file: {
         fileName,
         fileUrl: key,
         uploadedAt: new Date().toISOString(),
         rawContent: document.content,
      },
      chunks: chunks.map((chunk) => ({
         text: chunk.text,
         agentId: targetId,
         sourceId: key,
      })),
      fileName,
   };
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

      const inputPrompt = `
websiteUrl: ${websiteUrl}
userId: ${userId}
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
      const { generatedDocuments, id, target } = inputData;

      // Update status to chunking (processing and indexing)

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

      const minioClient = getMinioClient(serverEnv);
      const ragClient = createPgVector({
         pgVectorURL: serverEnv.PG_VECTOR_URL,
      });
      const bucketName = serverEnv.MINIO_BUCKET;

      // Process documents sequentially to keep resource usage predictable.
      const uploadedFiles: UploadedFile[] = [];
      const allChunks: ChunkItem[] = [];

      // Determine the target ID based on the target type
      const targetId = target === "brand" ? id : id;

      // Process documents using the helper function
      for (let docIndex = 0; docIndex < generatedDocuments.length; docIndex++) {
         const document = generatedDocuments[docIndex];

         if (!document) continue;

         try {
            const result = await buildAndUploadDocument({
               document,
               documentIndex: docIndex,
               targetId,
               target,
               bucketName,
               minioClient,
            });

            uploadedFiles.push(result.file);
            allChunks.push(...result.chunks);

            console.log(
               `[saveAndIndexBrandDocuments] Created ${result.chunks.length} chunks for document ${result.fileName}`,
            );
         } catch (error) {
            console.error(
               `[saveAndIndexBrandDocuments] Error processing document ${docIndex + 1}:`,
               error,
            );
            propagateError(error);
            throw AppError.internal(`Failed to process document ${docIndex + 1}`);
         }
      }

      // Persist uploaded file metadata based on target type
      const filesForDb = uploadedFiles.map(({ rawContent, ...rest }) => rest);
      await updateTargetUploadedFiles(targetId, target, filesForDb);

      if (allChunks.length > 0) {
         try {
            if (target === "brand") {
               allChunks.forEach(async (chunk) => {
                  await createBrandKnowledgeWithEmbedding(ragClient, {
                     chunk: chunk.text,
                     externalId: chunk.agentId,
                     sourceId: chunk.sourceId,
                     type: "document",
                  });
               });
            }
            if (target === "competitor") {
               allChunks.forEach(async (chunk) => {
                  await createCompetitorKnowledgeWithEmbedding(ragClient, {
                     chunk: chunk.text,
                     externalId: chunk.agentId,
                     sourceId: chunk.sourceId,
                     type: "document",
                  });
               });
            }
            console.log(
               `[saveAndIndexBrandDocuments] Successfully indexed ${allChunks.length} chunks to Chroma`,
            );
         } catch (error) {
            console.error(
               "[saveAndIndexBrandDocuments] Error saving chunks to Chroma:",
               error,
            );
            propagateError(error);
            throw AppError.internal("Failed to save chunks to vector database");
         }
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
