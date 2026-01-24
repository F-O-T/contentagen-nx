/**
 * Editor Diagnostics Client
 *
 * Main thread API for communicating with the diagnostics worker.
 * Provides debounced counting operations.
 */

import { diagnosticsConfig } from "../core/config";
import type { EditorWorkerMessage, EditorWorkerResponse } from "../schemas";

interface CountResult {
   wordCount: number;
   charCount: number;
}

export interface SeoAuditInput {
   content: string;
   title?: string;
   description?: string;
   targetKeywords?: string[];
}

type PendingRequest =
   | {
        kind: "count";
        resolve: (value: CountResult) => void;
        reject: (error: Error) => void;
     }
   | {
        kind: "seo";
        resolve: (value: unknown) => void;
        reject: (error: Error) => void;
     };

/**
 * Diagnostics Client
 *
 * Manages communication with the diagnostics web worker.
 */
export class DiagnosticsClient {
   private worker: Worker | null = null;
   private pendingRequests = new Map<string, PendingRequest>();
   private isReady = false;
   private readyPromise: Promise<void> | null = null;
   private readyResolve: (() => void) | null = null;

   // Debounce state
   private debounceTimer: ReturnType<typeof setTimeout> | null = null;
   private pendingText: string | null = null;
   private currentRequestId: string | null = null;
   private pendingAudit: SeoAuditInput | null = null;

   /**
    * Initialize the diagnostics client
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
               event: MessageEvent<EditorWorkerResponse>,
            ) => {
               this.handleMessage(event.data);
            };

            this.worker.onerror = (error) => {
               console.error("[DiagnosticsClient] Worker error:", error);
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
   private handleMessage(response: EditorWorkerResponse): void {
      switch (response.type) {
         case "ready":
            this.isReady = true;
            this.readyResolve?.();
            break;

         case "count-result": {
            const request = this.pendingRequests.get(response.id);
            if (request && request.kind === "count") {
               request.resolve({
                  wordCount: response.wordCount,
                  charCount: response.charCount,
               });
               this.pendingRequests.delete(response.id);
            }
            break;
         }

         case "seo-audit-result": {
            const request = this.pendingRequests.get(response.id);
            if (request && request.kind === "seo") {
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
               console.error("[DiagnosticsClient] Error:", response.message);
            }
            break;
         }
      }
   }

   /**
    * Post a message to the worker
    */
   private postMessage(message: EditorWorkerMessage): void {
      this.worker?.postMessage(message);
   }

   /**
    * Generate a unique request ID
    */
   private generateId(): string {
      return crypto.randomUUID();
   }

   /**
    * Count words and characters (immediate, no debounce)
    */
   async count(text: string): Promise<CountResult> {
      await this.initialize();

      const id = this.generateId();

      return new Promise<CountResult>((resolve, reject) => {
         this.pendingRequests.set(id, { kind: "count", resolve, reject });
         this.postMessage({ type: "count", id, text });
      });
   }

   /**
    * Debounced count - batches rapid calls
    */
   countDebounced(text: string, callback: (result: CountResult) => void): void {
      // Cancel previous pending request
      if (this.debounceTimer) {
         clearTimeout(this.debounceTimer);
      }
      if (this.currentRequestId) {
         this.cancel(this.currentRequestId);
         this.currentRequestId = null;
      }

      this.pendingText = text;

      this.debounceTimer = setTimeout(async () => {
         if (this.pendingText === null) return;

         try {
            const result = await this.count(this.pendingText);
            callback(result);
         } catch (error) {
            console.error("[DiagnosticsClient] Count failed:", error);
         }

         this.pendingText = null;
         this.debounceTimer = null;
      }, diagnosticsConfig.debounceMs);
   }

   /**
    * Run a SEO audit (immediate, no debounce)
    */
   async runSeoAudit(input: SeoAuditInput): Promise<unknown> {
      await this.initialize();

      const id = this.generateId();

      return new Promise<unknown>((resolve, reject) => {
         this.pendingRequests.set(id, { kind: "seo", resolve, reject });
         this.postMessage({
            type: "seo-audit",
            id,
            content: input.content,
            title: input.title,
            description: input.description,
            targetKeywords: input.targetKeywords,
         });
      });
   }

   /**
    * Debounced SEO audit - batches rapid calls
    */
   runSeoAuditDebounced(
      input: SeoAuditInput,
      callback: (result: unknown) => void,
      debounceMs = diagnosticsConfig.debounceMs,
   ): void {
      if (this.debounceTimer) {
         clearTimeout(this.debounceTimer);
      }
      if (this.currentRequestId) {
         this.cancel(this.currentRequestId);
         this.currentRequestId = null;
      }

      this.pendingAudit = input;

      this.debounceTimer = setTimeout(async () => {
         if (!this.pendingAudit) return;

         try {
            const result = await this.runSeoAudit(this.pendingAudit);
            callback(result);
         } catch (error) {
            console.error("[DiagnosticsClient] SEO audit failed:", error);
         }

         this.pendingAudit = null;
         this.debounceTimer = null;
      }, debounceMs);
   }

   /**
    * Cancel a pending count operation
    */
   cancel(id: string): void {
      this.pendingRequests.delete(id);
      this.postMessage({ type: "cancel", id });
   }

   /**
    * Cancel all pending operations
    */
   cancelAll(): void {
      if (this.debounceTimer) {
         clearTimeout(this.debounceTimer);
         this.debounceTimer = null;
      }
      this.pendingText = null;
      this.pendingAudit = null;

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
let clientInstance: DiagnosticsClient | null = null;

/**
 * Get the singleton diagnostics client instance
 */
export function getDiagnosticsClient(): DiagnosticsClient {
   if (!clientInstance) {
      clientInstance = new DiagnosticsClient();
   }
   return clientInstance;
}

/**
 * Initialize the diagnostics client (call early for faster first use)
 */
export async function initializeDiagnostics(): Promise<void> {
   const client = getDiagnosticsClient();
   await client.initialize();
}

/**
 * Calculate reading time from word count
 */
export function calculateReadingTime(
   wordCount: number,
   wordsPerMinute = diagnosticsConfig.wordsPerMinute,
): number {
   if (wordCount === 0) return 0;
   return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Count paragraphs in text (sync, for immediate UI updates)
 */
export function countParagraphs(text: string): number {
   if (!text || !text.trim()) return 0;
   const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
   return Math.max(paragraphs.length, 1);
}

/**
 * Count sentences in text (sync, for immediate UI updates)
 */
export function countSentences(text: string): number {
   if (!text || !text.trim()) return 0;
   const sentences = text
      .split(/[.!?]+(?:\s|$)/)
      .filter((s) => s.trim().length > 0);
   return Math.max(sentences.length, 1);
}
