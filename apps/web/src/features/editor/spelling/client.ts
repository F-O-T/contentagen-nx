/**
 * Spell Checker Client
 *
 * Main thread API for communicating with the spell checker worker.
 * Provides promise-based API with automatic ID tracking.
 */
import type {
   CompletionSpellingResult,
   SpellingError,
   SpellWorkerMessage,
   SpellWorkerResponse,
} from "../schemas";

type CheckProgressCallback = (errors: SpellingError[], done: boolean) => void;

interface PendingRequest {
   resolve: (value: undefined | string[] | CompletionSpellingResult) => void;
   reject: (error: Error) => void;
   progressCallback?: CheckProgressCallback;
}

/**
 * Spell Checker Client
 *
 * Manages communication with the spell checker web worker.
 */
export class SpellCheckerClient {
   private worker: Worker | null = null;
   private pendingRequests = new Map<string, PendingRequest>();
   private isReady = false;
   private readyPromise: Promise<void> | null = null;
   private readyResolve: (() => void) | null = null;

   /**
    * Initialize the spell checker client
    */
   async initialize(): Promise<void> {
      if (this.isReady) return;
      if (this.readyPromise) return this.readyPromise;

      this.readyPromise = new Promise<void>((resolve, reject) => {
         this.readyResolve = resolve;

         try {
            // Create worker from the worker file
            this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
               type: "module",
            });

            this.worker.onmessage = (
               event: MessageEvent<SpellWorkerResponse>,
            ) => {
               this.handleMessage(event.data);
            };

            this.worker.onerror = (error) => {
               console.error("[SpellCheckerClient] Worker error:", error);
               reject(new Error("Worker initialization failed"));
            };

            // Send init message
            this.postMessage({ type: "init" });
         } catch (error) {
            reject(error);
         }
      });

      return this.readyPromise;
   }

   /**
    * Handle messages from the worker
    */
   private handleMessage(response: SpellWorkerResponse): void {
      switch (response.type) {
         case "ready":
            this.isReady = true;
            this.readyResolve?.();
            break;

         case "check-progress": {
            const request = this.pendingRequests.get(response.id);
            if (request?.progressCallback) {
               request.progressCallback(response.errors, response.done);
               if (response.done) {
                  request.resolve(undefined);
                  this.pendingRequests.delete(response.id);
               }
            }
            break;
         }

         case "suggest-result": {
            const request = this.pendingRequests.get(response.id);
            if (request) {
               request.resolve(response.suggestions);
               this.pendingRequests.delete(response.id);
            }
            break;
         }

         case "check-completion-result": {
            const request = this.pendingRequests.get(response.id);
            if (request) {
               request.resolve(response.result);
               this.pendingRequests.delete(response.id);
            }
            break;
         }

         case "error": {
            if (response.id) {
               const request = this.pendingRequests.get(response.id);
               if (request) {
                  request.reject(new Error(response.message));
                  this.pendingRequests.delete(response.id);
               }
            } else {
               console.error("[SpellCheckerClient] Error:", response.message);
            }
            break;
         }
      }
   }

   /**
    * Post a message to the worker
    */
   private postMessage(message: SpellWorkerMessage): void {
      this.worker?.postMessage(message);
   }

   /**
    * Generate a unique request ID
    */
   private generateId(): string {
      return crypto.randomUUID();
   }

   /**
    * Check text for spelling errors
    * Results are streamed via the progress callback
    */
   async checkText(
      text: string,
      onProgress: CheckProgressCallback,
   ): Promise<void> {
      await this.initialize();

      const id = this.generateId();

      return new Promise<void>((resolve, reject) => {
         this.pendingRequests.set(id, {
            resolve: resolve as PendingRequest["resolve"],
            reject,
            progressCallback: onProgress,
         });

         this.postMessage({ type: "check", id, text });
      });
   }

   /**
    * Get suggestions for a misspelled word
    */
   async suggest(word: string): Promise<string[]> {
      await this.initialize();

      const id = this.generateId();

      return new Promise<string[]>((resolve, reject) => {
         this.pendingRequests.set(id, {
            resolve: resolve as (value: unknown) => void,
            reject,
         });

         this.postMessage({ type: "suggest", id, word });
      });
   }

   /**
    * Check a completion for spelling quality (for FIM filtering)
    */
   async checkCompletion(
      completion: string,
   ): Promise<CompletionSpellingResult> {
      await this.initialize();

      const id = this.generateId();

      return new Promise<CompletionSpellingResult>((resolve, reject) => {
         this.pendingRequests.set(id, {
            resolve: resolve as (value: unknown) => void,
            reject,
         });

         this.postMessage({ type: "check-completion", id, completion });
      });
   }

   /**
    * Cancel an in-progress check operation
    */
   cancel(id: string): void {
      this.pendingRequests.delete(id);
      this.postMessage({ type: "cancel", id });
   }

   /**
    * Cancel all pending operations
    */
   cancelAll(): void {
      for (const id of this.pendingRequests.keys()) {
         this.postMessage({ type: "cancel", id });
      }
      this.pendingRequests.clear();
   }

   /**
    * Terminate the worker
    */
   terminate(): void {
      this.cancelAll();
      this.worker?.terminate();
      this.worker = null;
      this.isReady = false;
      this.readyPromise = null;
   }
}

// Singleton instance
let clientInstance: SpellCheckerClient | null = null;

/**
 * Get the singleton spell checker client instance
 */
export function getSpellCheckerClient(): SpellCheckerClient {
   if (!clientInstance) {
      clientInstance = new SpellCheckerClient();
   }
   return clientInstance;
}

/**
 * Initialize the spell checker (call early for faster first use)
 */
export async function initializeSpellChecker(): Promise<void> {
   const client = getSpellCheckerClient();
   await client.initialize();
}
