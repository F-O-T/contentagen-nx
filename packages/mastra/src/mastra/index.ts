import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { documentSynthesizerAgent } from "./agents/document-syntethizer-agent";
import { documentGenerationAgent } from "./agents/document-generation-agent";
import { featureExtractionAgent } from "./agents/feature-extractor-agent";
import { companyInfoExtractorAgent } from "./agents/company-info-extractor-agent";
import { createBrandKnowledgeWorkflow } from "./workflows/create-brand-knowledge-and-index-documents";
import { createCompetitorKnowledgeWorkflow } from "./workflows/create-competitor-knowledge-and-index-documents";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { crawlCompetitorForFeatures } from "./workflows/crawl-for-competitor-features";
import { extractCompetitorBrandInfoWorkflow } from "./workflows/extract-competitor-brand-info";
export type CustomRuntimeContext = {
   language: "en" | "pt";
   userId: string;
};
export const mastra = new Mastra({
   bundler: {
      externals: ["@packages/openrouter", "@packages/workers"],
   },
   workflows: {
      createBrandKnowledgeWorkflow,
      createCompetitorKnowledgeWorkflow,
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
