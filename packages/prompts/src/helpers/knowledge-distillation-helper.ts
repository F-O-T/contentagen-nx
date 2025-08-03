// Helper for knowledge distillation prompt flow
// Import markdown files directly as raw text (requires Vite/Bun/modern bundler with ?raw)

import { chunkingPrompt } from "../prompts/task/chunking";
import { distillationPrompt } from "../prompts/task/distillation";
import { formattingPrompt } from "../prompts/task/formatting";

// Simple template interpolation
function interpolate(
   template: string,
   variables: Record<string, string>,
): string {
   let result = template;
   for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value);
   }
   return result;
}

// Section generators
export function getChunkingSection(inputText: string): string {
   return interpolate(chunkingPrompt.toString(), { inputText });
}

export function getDistillationSection(chunk: string): string {
   return interpolate(distillationPrompt.toString(), { chunk });
}

export function getFormattingSection(distilled: string): string {
   return interpolate(formattingPrompt.toString(), { distilled });
}

/**
 * Assembles a full knowledge distillation prompt with clear sections and separators.
 */
export function assembleKnowledgeDistillationPrompt({
   inputText,
   chunk,
   distilled,
}: {
   inputText?: string;
   chunk?: string;
   distilled?: string;
}): string {
   const sections: string[] = [];
   if (inputText) {
      sections.push(`# Chunking\n` + getChunkingSection(inputText));
   }
   if (chunk) {
      sections.push(`# Distillation\n` + getDistillationSection(chunk));
   }
   if (distilled) {
      sections.push(`# Formatting\n` + getFormattingSection(distilled));
   }
   return sections.filter(Boolean).join(`\n\n${"=".repeat(80)}\n\n`);
}

// Legacy exports for compatibility
export function getChunkingPrompt(): string {
   return chunkingPrompt();
}
export function getDistillationPrompt(): string {
   return distillationPrompt();
}
export function getFormattingPrompt(): string {
   return formattingPrompt();
}
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
