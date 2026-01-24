import type {
   CountResult,
   EditorWorkerMessage,
   EditorWorkerResponse,
} from "./editor-worker.types";

/**
 * Singleton worker instance
 */
let worker: Worker | null = null;
let workerReady = false;
let readyPromise: Promise<void> | null = null;

/**
 * Pending requests waiting for responses
 */
const pendingRequests = new Map<
   string,
   {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
   }
>();

/**
 * Generate unique request ID
 */
let requestIdCounter = 0;
function generateRequestId(): string {
   return `count-${Date.now()}-${requestIdCounter++}`;
}

/**
 * Initialize the worker singleton
 */
function getWorker(): Worker {
   if (worker) return worker;

   worker = new Worker(new URL("./editor-worker.worker.ts", import.meta.url), {
      type: "module",
   });

   worker.onmessage = (event: MessageEvent<EditorWorkerResponse>) => {
      const response = event.data;

      if (response.type === "ready") {
         workerReady = true;
         return;
      }

      // Handle responses with IDs
      if ("id" in response) {
         const pending = pendingRequests.get(response.id);
         if (!pending) return;

         if (response.type === "error") {
            pendingRequests.delete(response.id);
            pending.reject(new Error(response.message));
         } else if (response.type === "count-result") {
            pendingRequests.delete(response.id);
            pending.resolve({
               wordCount: response.wordCount,
               charCount: response.charCount,
            });
         }
      }
   };

   worker.onerror = (error) => {
      console.error("[EditorWorker Client] Worker error:", error);
      // Reject all pending requests
      for (const [id, pending] of pendingRequests) {
         pending.reject(new Error("Worker error"));
         pendingRequests.delete(id);
      }
   };

   return worker;
}

/**
 * Wait for the worker to be ready
 */
async function waitForReady(): Promise<void> {
   if (workerReady) return;

   if (readyPromise) return readyPromise;

   readyPromise = new Promise((resolve, reject) => {
      const w = getWorker();

      // Check if already ready
      if (workerReady) {
         resolve();
         return;
      }

      // Set up one-time ready listener
      const checkReady = (event: MessageEvent<EditorWorkerResponse>) => {
         if (event.data.type === "ready") {
            workerReady = true;
            resolve();
         } else if (
            event.data.type === "error" &&
            "id" in event.data &&
            event.data.id === "init"
         ) {
            reject(new Error(event.data.message));
         }
      };

      w.addEventListener("message", checkReady);

      // Send init message
      w.postMessage({ type: "init" } satisfies EditorWorkerMessage);

      // Timeout after 5 seconds
      setTimeout(() => {
         if (!workerReady) {
            reject(new Error("Worker initialization timeout"));
         }
      }, 5000);
   });

   return readyPromise;
}

/**
 * Send a message to the worker and wait for response
 */
function sendRequest<T>(
   message: EditorWorkerMessage & { id: string },
): Promise<T> {
   return new Promise((resolve, reject) => {
      pendingRequests.set(message.id, {
         resolve: resolve as (value: unknown) => void,
         reject,
      });

      getWorker().postMessage(message);
   });
}

/**
 * Count words and characters in text
 * Runs entirely in Web Worker - non-blocking
 */
export async function countText(text: string): Promise<CountResult> {
   await waitForReady();

   const id = generateRequestId();
   return sendRequest<CountResult>({
      type: "count",
      id,
      text,
   });
}

/**
 * Cancel an ongoing count operation
 */
export function cancelOperation(operationId: string): void {
   const w = getWorker();
   w.postMessage({
      type: "cancel",
      id: operationId,
   } satisfies EditorWorkerMessage);
   pendingRequests.delete(operationId);
}

/**
 * Preload the worker (optional - will auto-init on first use)
 */
export async function preloadWorker(): Promise<void> {
   await waitForReady();
}

/**
 * Check if the worker is ready
 */
export function isWorkerReady(): boolean {
   return workerReady;
}
