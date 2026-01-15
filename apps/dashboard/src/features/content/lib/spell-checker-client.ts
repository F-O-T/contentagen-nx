import type { SpellingGrammarError } from "../types/diagnostics";
import type {
	CompletionSpellingResult,
	WorkerMessage,
	WorkerResponse,
} from "./spell-checker.types";

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
		onProgress?: (errors: SpellingGrammarError[]) => void;
	}
>();

/**
 * Generate unique request ID
 */
let requestIdCounter = 0;
function generateRequestId(): string {
	return `req-${Date.now()}-${requestIdCounter++}`;
}

/**
 * Initialize the worker singleton
 */
function getWorker(): Worker {
	if (worker) return worker;

	worker = new Worker(
		new URL("./spell-checker.worker.ts", import.meta.url),
		{ type: "module" },
	);

	worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
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
			} else if (response.type === "check-progress") {
				// Handle streaming progress
				if (pending.onProgress && response.errors.length > 0) {
					pending.onProgress(response.errors);
				}
				// Only resolve when done
				if (response.done) {
					pendingRequests.delete(response.id);
					pending.resolve(response.errors);
				}
			} else if (response.type === "check-result") {
				// Legacy support for non-streaming
				pendingRequests.delete(response.id);
				pending.resolve(response.errors);
			} else if (response.type === "suggest-result") {
				pendingRequests.delete(response.id);
				pending.resolve(response.suggestions);
			} else if (response.type === "check-completion-result") {
				pendingRequests.delete(response.id);
				pending.resolve(response.result);
			}
		}
	};

	worker.onerror = (error) => {
		console.error("[SpellChecker Client] Worker error:", error);
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

		// Set up one-time ready listener (also handles init errors)
		const checkReady = (event: MessageEvent<WorkerResponse>) => {
			if (event.data.type === "ready") {
				workerReady = true;
				resolve();
			} else if (event.data.type === "error" && "id" in event.data && event.data.id === "init") {
				reject(new Error(event.data.message));
			}
		};

		w.addEventListener("message", checkReady);

		// Send init message
		w.postMessage({ type: "init" } satisfies WorkerMessage);

		// Timeout after 10 seconds
		setTimeout(() => {
			if (!workerReady) {
				reject(new Error("Worker initialization timeout"));
			}
		}, 10000);
	});

	return readyPromise;
}

/**
 * Send a message to the worker and wait for response
 */
function sendRequest<T>(
	message: WorkerMessage & { id: string },
	onProgress?: (errors: SpellingGrammarError[]) => void,
): Promise<T> {
	return new Promise((resolve, reject) => {
		pendingRequests.set(message.id, {
			resolve: resolve as (value: unknown) => void,
			reject,
			onProgress,
		});

		getWorker().postMessage(message);

		// No timeout - rely on cancellation instead
		// Large documents may take time, but worker streams results progressively
	});
}

/**
 * Check text for spelling errors
 * Runs entirely in Web Worker - non-blocking
 * Supports streaming via onProgress callback
 */
export async function checkText(
	text: string,
	onProgress?: (errors: SpellingGrammarError[]) => void,
): Promise<SpellingGrammarError[]> {
	await waitForReady();

	const id = generateRequestId();
	return sendRequest<SpellingGrammarError[]>(
		{
			type: "check",
			id,
			text,
		},
		onProgress,
	);
}

/**
 * Get spelling suggestions for a word
 * Runs entirely in Web Worker - non-blocking
 */
export async function suggestWord(word: string): Promise<string[]> {
	await waitForReady();

	const id = generateRequestId();
	return sendRequest<string[]>({
		type: "suggest",
		id,
		word,
	});
}

/**
 * Check spelling quality of a completion
 * Used for FIM (fill-in-middle) quality filtering
 */
export async function checkCompletionSpelling(
	completion: string,
): Promise<CompletionSpellingResult> {
	await waitForReady();

	const id = generateRequestId();
	return sendRequest<CompletionSpellingResult>({
		type: "check-completion",
		id,
		completion,
	});
}

/**
 * Cancel an ongoing check operation
 */
export function cancelCheck(checkId: string): void {
	const w = getWorker();
	w.postMessage({ type: "cancel", id: checkId } satisfies WorkerMessage);
	pendingRequests.delete(checkId);
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
