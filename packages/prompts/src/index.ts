import knowledgeDistillationPrompts from "./prompt-files/knowledge-distillation.json";
import chunkingPrompt from "./prompt-files/chunking.json";
import contentGenerationPrompts from "./prompt-files/content-generation.json";

export {
   knowledgeDistillationPrompts,
   contentGenerationPrompts,
   chunkingPrompt,
};

export * from "./text-utils";
export * from "./helpers/agent-system-prompt-assembler";

// Legacy exports for backwards compatibility
export { generateSystemPrompt as generateAgentPrompt } from "./helpers/agent-system-prompt-assembler";
