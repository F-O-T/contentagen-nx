import { runKnowledgeDistillation } from "@packages/prompts";

// Main trigger function
export async function knowledgeDistillationTrigger({
  text,
  apiKey,
}: {
  text: string;
  apiKey: string;
}) {
  return runKnowledgeDistillation({ text, apiKey });
}
