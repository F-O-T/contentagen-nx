import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

import { documentSynthesizerAgent } from "./agents/document-syntethizer-agent";
import { documentGenerationAgent } from "./agents/document-generation-agent";
import { createBrandKnowledgeWorkflow } from "./workflows/create-brand-knowledge-and-index-documents";
import type { RuntimeContext } from "@mastra/core/runtime-context";

type CustomRuntimeContext = {
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
   storage: new LibSQLStore({
      // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
      url: ":memory:",
   }),
   server: {
      middleware: [
         async (context, next) => {
            const language = context.req.header("X-Locale") as CustomRuntimeContext["language"];
            const runtimeContext = context.get("runtimeContext") as RuntimeContext<CustomRuntimeContext>;

            runtimeContext.set("language", language);
            await next();
         }
      ]
   },
   logger: new PinoLogger({
      name: "Mastra",
      level: "info",
   }),
});
