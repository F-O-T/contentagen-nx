import { buildExtractionPrompt } from "./prompts/knowledge-extractor-prompt";
import { knowledgeFormatterPrompt } from "./prompts/formatting-prompt";

export function getKnowledgeExtractorAgent() {
   return buildExtractionPrompt;
}

export function getFormatterAgent() {
   return knowledgeFormatterPrompt;
}
