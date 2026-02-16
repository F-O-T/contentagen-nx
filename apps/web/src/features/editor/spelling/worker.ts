/**
 * Spell Checker Web Worker
 *
 * Handles all spell checking operations in a background thread:
 * - Dictionary loading and caching
 * - Text validation (streaming batched results)
 * - Word suggestions
 * - Completion quality checking for FIM
 */
import {
   createSpellChecker,
   createWordRegex,
   shouldIgnoreWord as libShouldIgnoreWord,
   type SpellChecker,
} from "@f-o-t/spelling";
import {
   createDictionaryStorage,
   loadDictionary,
} from "@f-o-t/spelling/plugins/browser-storage";
import { spellCheckIgnoreList } from "../core/config";
import type {
   CompletionSpellingResult,
   SpellingError,
   SpellWorkerMessage,
   SpellWorkerResponse,
} from "../schemas";

/**
 * Pre-computed ignore set
 */
const IGNORE_SET = new Set(spellCheckIgnoreList.map((w) => w.toLowerCase()));

/**
 * Browser storage for dictionary caching (IndexedDB + Cache API)
 */
const dictionaryStorage = createDictionaryStorage({
   keyPrefix: "contentta-spelling",
   sessionTTL: 60 * 60 * 1000, // 1 hour
   indexedDBTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
});

let checkerInstance: SpellChecker | null = null;
let initializationPromise: Promise<void> | null = null;

// Track active check operations for cancellation
const activeChecks = new Set<string>();

/**
 * Initialize the spell checker with Portuguese dictionary
 */
async function initializeSpellChecker(): Promise<void> {
   if (checkerInstance) return;
   if (initializationPromise) return initializationPromise;

   initializationPromise = (async () => {
      const startTime = performance.now();

      // Load dictionary - uses IndexedDB/Cache API in workers
      const dictionaryData = await loadDictionary(
         "pt",
         "/dictionaries/pt/pt.aff",
         "/dictionaries/pt/pt.dic",
         dictionaryStorage,
      );

      checkerInstance = createSpellChecker({
         language: "pt",
         parsedAffData: dictionaryData.affData,
         parsedDicData: dictionaryData.dicData,
         ignoreCapitalized: true,
         minWordLength: 3,
         maxSuggestions: 8,
         ignoreList: spellCheckIgnoreList,
      });

      const loadTime = performance.now() - startTime;
      console.debug(
         `[SpellChecker Worker] Initialized in ${loadTime.toFixed(0)}ms (${checkerInstance.dictionarySize} words)`,
      );
   })();

   return initializationPromise;
}

/**
 * Check if a word should be ignored
 */
function shouldIgnoreWord(word: string): boolean {
   return libShouldIgnoreWord(word, {
      ignoreCapitalized: true,
      minWordLength: 3,
      ignoreList: IGNORE_SET,
   });
}

/**
 * Send a response to the main thread
 */
function postResponse(response: SpellWorkerResponse): void {
   self.postMessage(response);
}

/**
 * Handle check text request - streams results in batches
 */
async function handleCheck(id: string, text: string): Promise<void> {
   activeChecks.add(id);

   const BATCH_SIZE = 50; // Fewer batches = less message overhead

   try {
      await initializeSpellChecker();
      if (!checkerInstance) throw new Error("Spell checker not initialized");

      // Check if cancelled before processing
      if (!activeChecks.has(id)) return;

      let batch: SpellingError[] = [];
      let errorIndex = 0;

      for await (const error of checkerInstance.checkTextStream(text)) {
         // Check for cancellation periodically
         if (!activeChecks.has(id)) return;

         batch.push({
            id: `spelling-${error.offset}-${errorIndex++}`,
            type: "spelling" as const,
            original: error.word,
            suggestion: error.word,
            offset: error.offset,
            length: error.length,
            message: "Palavra não encontrada no dicionário",
         });

         // Send batch when it reaches the threshold
         if (batch.length >= BATCH_SIZE) {
            postResponse({
               type: "check-progress",
               id,
               errors: batch,
               done: false,
            });
            batch = [];
            // Yield to allow message processing on main thread
            await new Promise((resolve) => setTimeout(resolve, 0));
         }
      }

      // Final cancellation check before sending final results
      if (!activeChecks.has(id)) return;

      // Send final batch with done flag
      postResponse({ type: "check-progress", id, errors: batch, done: true });
   } catch (error) {
      postResponse({
         type: "error",
         id,
         message: error instanceof Error ? error.message : "Unknown error",
      });
   } finally {
      activeChecks.delete(id);
   }
}

/**
 * Handle suggest word request
 */
async function handleSuggest(id: string, word: string): Promise<void> {
   try {
      await initializeSpellChecker();
      if (!checkerInstance) throw new Error("Spell checker not initialized");

      const suggestions = checkerInstance.suggest(word, 5);
      postResponse({ type: "suggest-result", id, suggestions });
   } catch (error) {
      postResponse({
         type: "error",
         id,
         message: error instanceof Error ? error.message : "Unknown error",
      });
   }
}

/**
 * Handle check completion request (for FIM quality checking)
 */
async function handleCheckCompletion(
   id: string,
   completion: string,
): Promise<void> {
   try {
      // Skip very short completions
      if (completion.trim().length < 10) {
         postResponse({
            type: "check-completion-result",
            id,
            result: { score: 1, wordCount: 0, errorCount: 0, shouldShow: true },
         });
         return;
      }

      await initializeSpellChecker();
      if (!checkerInstance) throw new Error("Spell checker not initialized");

      // Extract words from completion
      const words: string[] = [];
      const regex = createWordRegex();
      let match: RegExpExecArray | null = regex.exec(completion);

      while (match !== null) {
         const word = match[0];
         if (!shouldIgnoreWord(word)) {
            words.push(word);
         }
         match = regex.exec(completion);
      }

      // No checkable words
      if (words.length === 0) {
         postResponse({
            type: "check-completion-result",
            id,
            result: { score: 1, wordCount: 0, errorCount: 0, shouldShow: true },
         });
         return;
      }

      // Count misspelled words
      let errorCount = 0;
      for (const word of words) {
         if (!checkerInstance.check(word)) {
            errorCount++;
         }
      }

      const score =
         words.length > 0 ? (words.length - errorCount) / words.length : 1;
      const errorRatio = errorCount / words.length;
      const shouldShow =
         errorRatio <= 0.2 || (words.length <= 10 && errorCount <= 2);

      const result: CompletionSpellingResult = {
         score,
         wordCount: words.length,
         errorCount,
         shouldShow,
      };

      postResponse({ type: "check-completion-result", id, result });
   } catch (error) {
      postResponse({
         type: "error",
         id,
         message: error instanceof Error ? error.message : "Unknown error",
      });
   }
}

/**
 * Handle cancel request
 */
function handleCancel(id: string): void {
   activeChecks.delete(id);
}

/**
 * Message handler
 */
self.onmessage = async (event: MessageEvent<SpellWorkerMessage>) => {
   const message = event.data;

   switch (message.type) {
      case "init":
         try {
            await initializeSpellChecker();
            postResponse({ type: "ready" });
         } catch (error) {
            postResponse({
               type: "error",
               id: "init",
               message: error instanceof Error ? error.message : "Init failed",
            });
         }
         break;

      case "check":
         handleCheck(message.id, message.text);
         break;

      case "suggest":
         handleSuggest(message.id, message.word);
         break;

      case "check-completion":
         handleCheckCompletion(message.id, message.completion);
         break;

      case "cancel":
         handleCancel(message.id);
         break;
   }
};

// Auto-initialize on worker start
initializeSpellChecker().catch((error) => {
   // Post error to main thread instead of silent failure
   postResponse({
      type: "error",
      id: "auto-init",
      message:
         error instanceof Error
            ? error.message
            : "Failed to auto-initialize spell checker",
   });
});
