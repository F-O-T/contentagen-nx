import type { SpellingGrammarError } from "../types/diagnostics";

/**
 * Messages sent from main thread to worker
 */
export type WorkerMessage =
	| { type: "init" }
	| { type: "check"; id: string; text: string }
	| { type: "suggest"; id: string; word: string }
	| { type: "check-completion"; id: string; completion: string }
	| { type: "cancel"; id: string };

/**
 * Responses sent from worker to main thread
 */
export type WorkerResponse =
	| { type: "ready" }
	| { type: "check-result"; id: string; errors: SpellingGrammarError[] }
	| { type: "check-progress"; id: string; errors: SpellingGrammarError[]; done: boolean }
	| { type: "suggest-result"; id: string; suggestions: string[] }
	| {
			type: "check-completion-result";
			id: string;
			result: CompletionSpellingResult;
	  }
	| { type: "error"; id: string; message: string };

/**
 * Result of checking completion text for spelling quality
 */
export type CompletionSpellingResult = {
	score: number;
	wordCount: number;
	errorCount: number;
	shouldShow: boolean;
};
