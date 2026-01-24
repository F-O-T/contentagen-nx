/**
 * Messages sent from main thread to worker
 */
export type EditorWorkerMessage =
   | { type: "init" }
   | { type: "count"; id: string; text: string }
   | { type: "cancel"; id: string };

/**
 * Responses sent from worker to main thread
 */
export type EditorWorkerResponse =
   | { type: "ready" }
   | { type: "count-result"; id: string; wordCount: number; charCount: number }
   | { type: "error"; id: string; message: string };

/**
 * Count result type
 */
export type CountResult = {
   wordCount: number;
   charCount: number;
};
