import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { documentSynthesizerAgent } from "./agents/document-syntethizer-agent";
import { documentGenerationAgent } from "./agents/document-generation-agent";
import { featureExtractionAgent } from "./agents/feature-extractor-agent";
import { companyInfoExtractorAgent } from "./agents/company-info-extractor-agent";
import { createBrandKnowledgeWorkflow } from "./workflows/create-brand-knowledge-and-index-documents";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { crawlCompetitorForFeatures } from "./workflows/crawl-for-features";
import { extractCompetitorBrandInfoWorkflow } from "./workflows/extract-brand-info";
export type CustomRuntimeContext = {
   language: "en" | "pt";
   userId: string;
};
export const mastra = new Mastra({
   bundler: {
      sourcemap: true,
      transpilePackages: [
         "@packages/files/client",
         "@packages/payment/client",
         "@packages/payment/ingestion",
         "@packages/tavily/helpers",
         "@packages/tavily/client",
         "@packages/chroma-db/client",
         "@packages/chroma-db/helpers",
         "@packages/environment/helpers",
         "@packages/environment/server",
      ],
   },

   workflows: {
      createBrandKnowledgeWorkflow,
      crawlCompetitorForFeatures,
      extractCompetitorBrandInfoWorkflow,
   },
   agents: {
      documentSynthesizerAgent,
      documentGenerationAgent,
      featureExtractionAgent,
      companyInfoExtractorAgent,
   },
   logger: new PinoLogger({
      name: "Mastra",
      level: "info",
   }),
});

export function setRuntimeContext(context: CustomRuntimeContext) {
   const runtimeContext = new RuntimeContext<CustomRuntimeContext>();

   runtimeContext.set("language", context.language);
   runtimeContext.set("userId", context.userId);
}
