import Typo from "typo-js";
import type { SpellingGrammarError } from "../types/diagnostics";

/**
 * Singleton spell checker instance using typo-js with pt-BR dictionary
 */
let typoInstance: Typo | null = null;
let loadingPromise: Promise<Typo> | null = null;

/**
 * Initialize the spell checker with Portuguese (pt-BR) dictionary.
 * Loads dictionary files from /dictionaries/pt/ on first call.
 */
async function initializeTypo(): Promise<Typo> {
	if (typoInstance) {
		return typoInstance;
	}

	if (loadingPromise) {
		return loadingPromise;
	}

	loadingPromise = (async () => {
		try {
			// Fetch dictionary files from public folder
			const [affResponse, dicResponse] = await Promise.all([
				fetch("/dictionaries/pt/pt.aff"),
				fetch("/dictionaries/pt/pt.dic"),
			]);

			if (!affResponse.ok || !dicResponse.ok) {
				throw new Error("Failed to load dictionary files");
			}

			const [affData, dicData] = await Promise.all([
				affResponse.text(),
				dicResponse.text(),
			]);

			// Initialize Typo with the dictionary data
			typoInstance = new Typo("pt", affData, dicData);
			return typoInstance;
		} catch (error) {
			loadingPromise = null;
			throw error;
		}
	})();

	return loadingPromise;
}

/**
 * Check if the spell checker is ready to use
 */
export function isSpellCheckerReady(): boolean {
	return typoInstance !== null;
}

/**
 * Check if a single word is spelled correctly
 */
export async function checkWord(word: string): Promise<boolean> {
	const typo = await initializeTypo();
	return typo.check(word);
}

/**
 * Get spelling suggestions for a misspelled word
 */
export async function suggestWord(word: string): Promise<string[]> {
	const typo = await initializeTypo();
	return typo.suggest(word);
}

/**
 * Word boundary regex - matches word characters including accented Portuguese letters
 */
const WORD_REGEX = /[\p{L}\p{M}]+/gu;

/**
 * Words to ignore (common technical terms, markdown syntax, etc.)
 */
const IGNORE_LIST = new Set([
	// Common abbreviations
	"etc",
	"vs",
	"ex",
	"ie",
	"eg",
	// Technical terms
	"api",
	"url",
	"html",
	"css",
	"http",
	"https",
	"json",
	"xml",
	"sql",
	"sdk",
	"cli",
	"gui",
	"pdf",
	"png",
	"jpg",
	"gif",
	"svg",
	// Common English words in Portuguese tech context
	"app",
	"web",
	"email",
	"online",
	"offline",
	"software",
	"hardware",
	"download",
	"upload",
	"login",
	"logout",
	"link",
	"links",
	"blog",
	"post",
	"posts",
	"site",
	"sites",
	"home",
]);

/**
 * Check if a word should be ignored
 */
function shouldIgnoreWord(word: string): boolean {
	const lowerWord = word.toLowerCase();

	// Ignore words in the ignore list
	if (IGNORE_LIST.has(lowerWord)) {
		return true;
	}

	// Ignore very short words (1-2 chars)
	if (word.length < 3) {
		return true;
	}

	// Ignore words that are all caps (likely acronyms)
	if (word === word.toUpperCase() && word.length <= 5) {
		return true;
	}

	// Ignore words that start with uppercase (likely proper nouns)
	const firstChar = word[0];
	if (firstChar && firstChar === firstChar.toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()) {
		// Allow checking if it's a common word that shouldn't be capitalized
		return true;
	}

	// Ignore words with numbers
	if (/\d/.test(word)) {
		return true;
	}

	return false;
}

/**
 * Check text for spelling errors
 * Returns an array of spelling errors with positions and suggestions
 */
export async function checkText(text: string): Promise<SpellingGrammarError[]> {
	const typo = await initializeTypo();
	const errors: SpellingGrammarError[] = [];
	let match: RegExpExecArray | null;
	let errorIndex = 0;

	// Reset regex lastIndex
	WORD_REGEX.lastIndex = 0;

	while ((match = WORD_REGEX.exec(text)) !== null) {
		const word = match[0];
		const offset = match.index;

		// Skip ignored words
		if (shouldIgnoreWord(word)) {
			continue;
		}

		// Check spelling
		if (!typo.check(word)) {
			const suggestions = typo.suggest(word);
			const firstSuggestion = suggestions[0];
			const suggestion = firstSuggestion ?? word;

			errors.push({
				id: `spelling-${offset}-${errorIndex}`,
				type: "spelling",
				original: word,
				suggestion,
				offset,
				length: word.length,
				message: suggestions.length > 0
					? `Sugestão: ${suggestion}`
					: "Palavra não encontrada no dicionário",
			});

			errorIndex++;
		}
	}

	return errors;
}

/**
 * Preload the dictionary (call on app init for better UX)
 */
export async function preloadDictionary(): Promise<void> {
	await initializeTypo();
}

/**
 * Result of checking completion text for spelling quality
 */
export interface CompletionSpellingResult {
	/** Score from 0-1 (1 = perfect, 0 = many errors) */
	score: number;
	/** Number of words checked */
	wordCount: number;
	/** Number of spelling errors found */
	errorCount: number;
	/** Whether the completion should be shown based on spelling quality */
	shouldShow: boolean;
}

/**
 * Check spelling quality of a FIM completion.
 * Used to filter out completions with too many spelling errors.
 *
 * @param completion - The completion text to check
 * @returns Spelling quality result with score and recommendation
 */
export async function checkCompletionSpelling(
	completion: string,
): Promise<CompletionSpellingResult> {
	// Skip very short completions
	if (completion.trim().length < 10) {
		return { score: 1, wordCount: 0, errorCount: 0, shouldShow: true };
	}

	const typo = await initializeTypo();

	// Extract words from completion
	const words: string[] = [];
	let match: RegExpExecArray | null;
	const regex = new RegExp(WORD_REGEX.source, "gu");

	while ((match = regex.exec(completion)) !== null) {
		const word = match[0];
		if (!shouldIgnoreWord(word)) {
			words.push(word);
		}
	}

	// No checkable words
	if (words.length === 0) {
		return { score: 1, wordCount: 0, errorCount: 0, shouldShow: true };
	}

	// Count misspelled words
	let errorCount = 0;
	for (const word of words) {
		if (!typo.check(word)) {
			errorCount++;
		}
	}

	// Calculate score (percentage of correctly spelled words)
	const score = words.length > 0 ? (words.length - errorCount) / words.length : 1;

	// Threshold: Allow up to 20% errors, or at most 2 errors for short completions
	const errorRatio = errorCount / words.length;
	const shouldShow = errorRatio <= 0.2 || (words.length <= 10 && errorCount <= 2);

	return {
		score,
		wordCount: words.length,
		errorCount,
		shouldShow,
	};
}
