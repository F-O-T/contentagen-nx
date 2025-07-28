// Helper for knowledge distillation prompt flow
import { join } from "node:path";
import { readFileSync } from "node:fs";

// Loads a prompt template from the task category
function loadTaskPrompt(name: string): string {
   const filePath = join(__dirname, "..", "prompt-files", "task", `${name}.md`);
   return readFileSync(filePath, "utf-8");
}

/**
 * Returns the prompt for chunking a large text into logical sections.
 */
export function getChunkingPrompt(): string {
   return loadTaskPrompt("chunking");
}

/**
 * Returns the prompt for distilling knowledge from a text chunk.
 */
export function getDistillationPrompt(): string {
   return loadTaskPrompt("distillation");
}

/**
 * Returns the prompt for formatting distilled knowledge.
 */
export function getFormattingPrompt(): string {
   return loadTaskPrompt("formatting");
}

/**
 * Returns all knowledge distillation prompts in order: chunking, distillation, formatting.
 */
export function getKnowledgeDistillationPrompts(): {
   chunking: string;
   distillation: string;
   formatting: string;
} {
   return {
      chunking: getChunkingPrompt(),
      distillation: getDistillationPrompt(),
      formatting: getFormattingPrompt(),
   };
}
