import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { checkText, preloadDictionary } from "../lib/spell-checker";
import type { SpellingGrammarError } from "../types/diagnostics";

type UseSpellingCheckOptions = {
	debounceMs?: number;
	onError?: (error: Error) => void;
};

export function useSpellingCheck(options: UseSpellingCheckOptions = {}) {
	const { debounceMs = 1500, onError } = options;

	const [errors, setErrors] = useState<SpellingGrammarError[]>([]);
	const [isChecking, setIsChecking] = useState(false);
	const isCancelledRef = useRef(false);
	const dictionaryLoadedRef = useRef(false);

	// Defer dictionary preload to avoid blocking initial render
	useEffect(() => {
		// Wait for initial render to complete before loading dictionary
		const timeoutId = setTimeout(() => {
			preloadDictionary()
				.then(() => {
					dictionaryLoadedRef.current = true;
				})
				.catch((error) => {
					console.error("Failed to preload dictionary:", error);
				});
		}, 500);

		return () => clearTimeout(timeoutId);
	}, []);

	const checkSpelling = useCallback(
		async (text: string) => {
			// Reset cancellation flag
			isCancelledRef.current = false;

			// Don't check empty or very short text
			if (text.trim().length < 20) {
				setErrors([]);
				return;
			}

			setIsChecking(true);

			try {
				const foundErrors = await checkText(text);

				// Check if operation was cancelled
				if (isCancelledRef.current) {
					return;
				}

				setErrors(foundErrors);
			} catch (error) {
				if (!isCancelledRef.current) {
					onError?.(error as Error);
					console.error("Spelling check error:", error);
				}
			} finally {
				if (!isCancelledRef.current) {
					setIsChecking(false);
				}
			}
		},
		[onError],
	);

	const { call: debouncedCheck, cancel: cancelCheck } = useDebouncedCallback(
		checkSpelling,
		debounceMs,
	);

	const applyFix = useCallback(
		(errorId: string): SpellingGrammarError | undefined => {
			const error = errors.find((e) => e.id === errorId);
			setErrors((prev) => prev.filter((e) => e.id !== errorId));
			return error;
		},
		[errors],
	);

	const ignoreFix = useCallback((errorId: string) => {
		setErrors((prev) =>
			prev.map((e) => (e.id === errorId ? { ...e, ignored: true } : e)),
		);
	}, []);

	const clearErrors = useCallback(() => {
		setErrors([]);
	}, []);

	const cancelPending = useCallback(() => {
		cancelCheck();
		isCancelledRef.current = true;
	}, [cancelCheck]);

	return {
		errors: errors.filter((e) => !e.ignored),
		allErrors: errors,
		isChecking,
		checkSpelling: debouncedCheck,
		applyFix,
		ignoreFix,
		clearErrors,
		cancelPending,
	};
}
