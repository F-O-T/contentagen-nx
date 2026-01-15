import type {
   EditorWorkerMessage,
   EditorWorkerResponse,
} from "./editor-worker.types";

/**
 * Track active operations for cancellation
 */
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
   activeOperations.add(id);

   // Check for cancellation before processing
   if (!activeOperations.has(id)) return;

   const wordCount = countWords(text);
   const charCount = text.length;

   // Check for cancellation before sending result
   if (!activeOperations.has(id)) return;

   postResponse({ type: "count-result", id, wordCount, charCount });
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

      case "cancel":
         handleCancel(message.id);
         break;
   }
};
