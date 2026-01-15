import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { checkText, preloadWorker } from "../lib/spell-checker-client";
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
	const accumulatedErrorsRef = useRef<SpellingGrammarError[]>([]);
	const updateTimeoutRef = useRef<number | null>(null);

	// Preload worker in background (non-blocking)
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			preloadWorker().catch((error) => {
				console.error("Failed to preload spell checker worker:", error);
			});
		}, 500);

		return () => clearTimeout(timeoutId);
	}, []);

	// Debounced UI update - max 10 updates/sec instead of 200
	const scheduleUpdate = useCallback(() => {
		if (updateTimeoutRef.current) return; // Already scheduled

		updateTimeoutRef.current = window.setTimeout(() => {
			updateTimeoutRef.current = null;
			if (!isCancelledRef.current) {
				setErrors([...accumulatedErrorsRef.current]);
			}
		}, 100); // Update UI max 10 times/second
	}, []);

	const checkSpelling = useCallback(
		async (text: string) => {
			// Reset cancellation flag and accumulated errors
			isCancelledRef.current = false;
			accumulatedErrorsRef.current = [];

			// Clear any pending UI update
			if (updateTimeoutRef.current) {
				clearTimeout(updateTimeoutRef.current);
				updateTimeoutRef.current = null;
			}

			// Don't check empty or very short text
			if (text.trim().length < 20) {
				setErrors([]);
				return;
			}

			setIsChecking(true);
			setErrors([]); // Clear previous errors before starting

			try {
				// Run spell check in Web Worker with streaming progress
				await checkText(text, (progressErrors) => {
					// Handle streaming batch updates
					if (!isCancelledRef.current) {
						// Push without spreading (O(1) per batch instead of O(n))
						accumulatedErrorsRef.current.push(...progressErrors);
						scheduleUpdate(); // Debounced UI update
					}
				});

				// Force final update immediately (don't wait for debounce)
				if (!isCancelledRef.current) {
					if (updateTimeoutRef.current) {
						clearTimeout(updateTimeoutRef.current);
						updateTimeoutRef.current = null;
					}
					setErrors([...accumulatedErrorsRef.current]);
					setIsChecking(false);
				}
			} catch (error) {
				if (!isCancelledRef.current) {
					onError?.(error as Error);
					console.error("Spelling check error:", error);
					setIsChecking(false);
				}
			}
		},
		[onError, scheduleUpdate],
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
