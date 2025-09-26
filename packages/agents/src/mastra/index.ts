import { Mastra } from "@mastra/core/mastra";
import { contentReaderAgent } from "./agents/content-reviewer-agent";
import { researcherAgent } from "./agents/researcher-agent";
import { PinoLogger } from "@mastra/loggers";
import { documentSynthesizerAgent } from "./agents/document-syntethizer-agent";
import { documentGenerationAgent } from "./agents/document-generation-agent";
import { featureExtractionAgent } from "./agents/feature-extractor-agent";
import { companyInfoExtractorAgent } from "./agents/company-info-extractor-agent";
import { createBrandKnowledgeWorkflow } from "./workflows/create-brand-knowledge-and-index-documents";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { crawlCompetitorForFeatures } from "./workflows/crawl-for-features";
import { extractCompetitorBrandInfoWorkflow } from "./workflows/extract-brand-info";
import { createNewContentWorkflow } from "./workflows/create-new-content-workflow";
import { tutorialEditorAgent } from "./agents/tutorial-editor-agent";
import { changelogEditorAgent } from "./agents/changelog-editor-agent";
import { articleEditorAgent } from "./agents/article-editor-agent";
import { interviewEditorAgent } from "./agents/interview-editor-agent";
import { contentStrategistAgent } from "./agents/strategist-agent";
import { tutorialWriterAgent } from "./agents/tutorial-writer-agent";
import { changelogWriterAgent } from "./agents/changelog-writer-agent";
import { articleWriterAgent } from "./agents/article-writer-agent";
import { interviewWriterAgent } from "./agents/interview-writer-agent";
import { createNewChangelogWorkflow } from "./workflows/create-new-changelog-workflow";
export type CustomRuntimeContext = {
   language: "en" | "pt";
   userId: string;
};
export const mastra = new Mastra({
   bundler: {
      transpilePackages: [
         "@packages/files/client",
         "@packages/payment/client",
         "@packages/payment/ingestion",
         "@packages/environment/helpers",
         "@packages/environment/server",
         "@packages/database/client",
         "@packages/rag/client",
         "@packages/utils/errors",
      ],
   },
   workflows: {
      createNewChangelogWorkflow,
      createNewContentWorkflow,
      createBrandKnowledgeWorkflow,
      crawlCompetitorForFeatures,
      extractCompetitorBrandInfoWorkflow,
   },
   agents: {
      tutorialEditorAgent,
      changelogEditorAgent,
      articleEditorAgent,
      interviewEditorAgent,
      tutorialWriterAgent,
      changelogWriterAgent,
      articleWriterAgent,
      interviewWriterAgent,
      contentStrategistAgent,
      documentSynthesizerAgent,
      documentGenerationAgent,
      featureExtractionAgent,
      companyInfoExtractorAgent,
      researcherAgent,
      contentReaderAgent,
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
