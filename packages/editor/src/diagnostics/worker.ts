/**
 * Editor Diagnostics Web Worker
 *
 * Handles content analysis operations in a background thread:
 * - Word count
 * - Character count
 * - Paragraph count
 * - Sentence count
 * - Reading time estimation
 */
import { analyzeContent } from "@f-o-t/content-analysis";
import type { EditorWorkerMessage, EditorWorkerResponse } from "../schemas";

// Track active operations for cancellation
const activeOperations = new Set<string>();

/**
 * Count words in a text string
 */
function countWords(text: string): number {
   if (!text || !text.trim()) return 0;

   // Split by whitespace and filter empty strings
   const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

   return words.length;
}

/**
 * Send a response to the main thread
 */
function postResponse(response: EditorWorkerResponse): void {
   self.postMessage(response);
}

/**
 * Handle count request
 */
function handleCount(id: string, text: string): void {
   // Check if this operation was already cancelled before we start
   if (activeOperations.has(id)) {
      return; // Skip if already processing (shouldn't happen, but defensive)
   }

   activeOperations.add(id);

   const wordCount = countWords(text);
   const charCount = text.length;

   // Check for cancellation before sending result
   if (!activeOperations.has(id)) return;

   postResponse({ type: "count-result", id, wordCount, charCount });
   activeOperations.delete(id);
}

/**
 * Handle SEO audit request
 */
function handleSeoAudit(
   id: string,
   content: string,
   title?: string,
   description?: string,
   targetKeywords?: string[],
): void {
   if (activeOperations.has(id)) {
      return;
   }

   activeOperations.add(id);

   const result = analyzeContent({
      content,
      title,
      description,
      targetKeywords,
   });

   if (!activeOperations.has(id)) return;

   postResponse({ type: "seo-audit-result", id, result });
   activeOperations.delete(id);
}

/**
 * Handle cancel request
 */
function handleCancel(id: string): void {
   activeOperations.delete(id);
}

/**
 * Message handler
 */
self.onmessage = (event: MessageEvent<EditorWorkerMessage>) => {
   const message = event.data;

   switch (message.type) {
      case "init":
         postResponse({ type: "ready" });
         break;

      case "count":
         handleCount(message.id, message.text);
         break;

      case "seo-audit":
         handleSeoAudit(
            message.id,
            message.content,
            message.title,
            message.description,
            message.targetKeywords,
         );
         break;

      case "cancel":
         handleCancel(message.id);
         break;
   }
};
