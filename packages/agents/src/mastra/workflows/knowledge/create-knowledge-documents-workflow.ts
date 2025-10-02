import { createWorkflow, createStep } from "@mastra/core/workflows";
import { createBrandKnowledgeWithEmbedding } from "@packages/rag/repositories/brand-knowledge-repository";
import { createCompetitorKnowledgeWithEmbedding } from "@packages/rag/repositories/competitor-knowledge-repository";
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
import { AppError, propagateError } from "@packages/utils/errors";
import crypto from "node:crypto";

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

   if (target === "competitor") {
      await updateCompetitor(db, targetId, { uploadedFiles });
   } else {
      // TODO: Implement brand update logic in the future
      console.log(`[updateTargetUploadedFiles] Brand file upload not yet implemented`);
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
export const CreateKnowledgeDocumentsInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   targetId: z.string(),
   target: z.enum(["brand", "competitor"]),
});

// Output schema for the workflow
export const CreateKnowledgeDocumentsOutput = z.object({
   chunkCount: z.number(),
});

const createKnowledgeDocumentsOutputSchema = CreateKnowledgeDocumentsInput.extend({
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
      .describe("Exactly 5 business documents generated from target analysis"),
});

const getFullKnowledgeAnalysisOutputSchema = CreateKnowledgeDocumentsInput.extend({
   fullAnalysis: z
      .string()
      .describe("Complete target analysis document in perfect markdown format"),
});

const getFullKnowledgeAnalysis = createStep({
   id: "get-full-knowledge-analysis-step",
   description: "Get comprehensive target analysis with improved target support",
   inputSchema: CreateKnowledgeDocumentsInput,
   outputSchema: getFullKnowledgeAnalysisOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, targetId, target } = inputData;

      const inputPrompt = `
websiteUrl: ${websiteUrl}
userId: ${userId}
target: ${target}
targetId: ${targetId}

Please provide a comprehensive analysis of this ${target} website. Focus on:
- Company overview and positioning
- Products and services offered
- Target audience and market approach
- Competitive advantages and unique selling points
- Business model and revenue streams
- Brand voice and communication style

Provide a detailed analysis that will be used to generate 5 comprehensive business documents.
`;

      const result = await documentSynthesizerAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: getFullKnowledgeAnalysisOutputSchema.pick({
               fullAnalysis: true,
            }),
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to generate ${target} analysis: documentSynthesizerAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { fullAnalysis } = result.object;

      return {
         fullAnalysis,
         userId,
         websiteUrl,
         targetId,
         target,
      };
   },
});

const createKnowledgeDocuments = createStep({
   id: "create-knowledge-documents-step",
   description: "Create comprehensive documents for target with improved target handling",
   inputSchema: getFullKnowledgeAnalysisOutputSchema,
   outputSchema: createKnowledgeDocumentsOutputSchema,
   execute: async ({ inputData }) => {
      const { fullAnalysis, userId, targetId, target, websiteUrl } = inputData;

      const inputPrompt = `
Generate 5 distinct business documents from this ${target} analysis:

${fullAnalysis}

Requirements:
- Generate exactly 5 documents:
  1. Brand Identity & Positioning Profile
  2. Product/Service Catalog & Capabilities
  3. Market Presence & Competitive Analysis
  4. Customer Base & Target Audience Analysis
  5. Business Assets & Resources Inventory
- Each document must be comprehensive, actionable, and in perfect markdown format
- Base all recommendations on the provided analysis data
- Include specific metrics, timelines, and implementation details where applicable
- Maintain consistency across all documents
- Use professional business language
- Adapt content based on target type (brand vs competitor)
- For brands: focus on internal capabilities and growth opportunities
- For competitors: focus on competitive intelligence and market positioning

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
            output: createKnowledgeDocumentsOutputSchema,
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to generate ${target} documents: documentGenerationAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { generatedDocuments } = result.object;
      return {
         generatedDocuments,
         userId,
         websiteUrl,
         targetId,
         target,
      };
   },
});

const saveAndIndexKnowledgeDocuments = createStep({
   id: "save-and-index-knowledge-documents-step",
   description:
      "Save target documents to MinIO, database, and appropriate vector database with improved target handling",
   inputSchema: createKnowledgeDocumentsOutputSchema,
   outputSchema: CreateKnowledgeDocumentsOutput,
   execute: async ({ inputData }) => {
      const { generatedDocuments, targetId, target } = inputData;

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

      // Process documents using the helper function for the target
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
               `[saveAndIndexKnowledgeDocuments] Created ${result.chunks.length} chunks for ${target} document ${result.fileName}`,
            );
         } catch (error) {
            console.error(
               `[saveAndIndexKnowledgeDocuments] Error processing ${target} document ${docIndex + 1}:`,
               error,
            );
            propagateError(error);
            throw AppError.internal(
               `Failed to process ${target} document ${docIndex + 1}`,
            );
         }
      }

      // Persist uploaded file metadata for the target
      const filesForDb = uploadedFiles.map(({ rawContent, ...rest }) => rest);
      await updateTargetUploadedFiles(targetId, target, filesForDb);

      // Save chunks to appropriate vector database
      if (allChunks.length > 0) {
         try {
            await Promise.all(
               allChunks.map(async (chunk) => {
                  if (target === "competitor") {
                     await createCompetitorKnowledgeWithEmbedding(ragClient, {
                        chunk: chunk.text,
                        externalId: chunk.agentId,
                        sourceId: chunk.sourceId,
                        type: "document",
                     });
                  } else {
                     await createBrandKnowledgeWithEmbedding(ragClient, {
                        chunk: chunk.text,
                        externalId: chunk.agentId,
                        sourceId: chunk.sourceId,
                        type: "document",
                     });
                  }
               }),
            );
            console.log(
               `[saveAndIndexKnowledgeDocuments] Successfully indexed ${allChunks.length} chunks to ${target} vector database`,
            );
         } catch (error) {
            console.error(
               `[saveAndIndexKnowledgeDocuments] Error saving chunks to ${target} vector database:`,
               error,
            );
            propagateError(error);
            throw AppError.internal(
               `Failed to save chunks to ${target} vector database`,
            );
         }
      }

      return {
         chunkCount: allChunks.length,
      };
   },
});

export const createKnowledgeDocumentsWorkflow = createWorkflow({
   id: "create-knowledge-documents",
   description: "Create comprehensive documents for target and index them with improved target support",
   inputSchema: CreateKnowledgeDocumentsInput,
   outputSchema: CreateKnowledgeDocumentsOutput,
})
   .then(getFullKnowledgeAnalysis)
   .then(createKnowledgeDocuments)
   .then(saveAndIndexKnowledgeDocuments)
   .commit();