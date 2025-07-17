import knowledgeDistillationPrompts from "./knowledge-distillation.json";

export function buildExtractionPrompt(
  rawText: string,
  sourceType: string,
): string {
  return knowledgeDistillationPrompts.extraction
    .replace("{rawText}", rawText)
    .replace("{sourceType}", sourceType);
}

export function buildFormattingPrompt(
  sourceType: string,
  extracted: string,
): string {
  return (
    knowledgeDistillationPrompts.formatting.replace(
      "{sourceType}",
      sourceType,
    ) +
    '\n\nKnowledgePoints:\n"""' +
    extracted +
    '"""'
  );
}
