import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { documentSynthesizerAgent } from "./agents/document-syntethizer-agent";
import { documentGenerationAgent } from "./agents/document-generation-agent";
import { createBrandKnowledgeWorkflow } from "./workflows/create-brand-knowledge-and-index-documents";
import { RuntimeContext } from "@mastra/core/runtime-context";

export type CustomRuntimeContext = {
   language: "en" | "pt";
};
export const mastra = new Mastra({
   bundler: {
      externals: ["@packages/openrouter", "@packages/workers"],
   },
   workflows: {
      createBrandKnowledgeWorkflow,
   },
   agents: {
      documentSynthesizerAgent,
      documentGenerationAgent,
   },
   logger: new PinoLogger({
      name: "Mastra",
      level: "info",
   }),
});

export function setRuntimeContext(context: CustomRuntimeContext) {
   const runtimeContext = new RuntimeContext<CustomRuntimeContext>();

   runtimeContext.set("language", context.language);
}
