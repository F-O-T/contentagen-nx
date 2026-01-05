import { useCallback, useEffect, useRef } from "react";

export interface DebouncedCallback<T extends unknown[]> {
	call: (...args: T) => void;
	flush: () => void;
	cancel: () => void;
}

export function useDebouncedCallback<T extends unknown[]>(
	callback: (...args: T) => void,
	delay: number,
): DebouncedCallback<T> {
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
	const callbackRef = useRef(callback);
	const pendingArgsRef = useRef<T | null>(null);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const call = useCallback(
		(...args: T) => {
			pendingArgsRef.current = args;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
				pendingArgsRef.current = null;
			}, delay);
		},
		[delay],
	);

	const flush = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = undefined;
		}
		if (pendingArgsRef.current) {
			callbackRef.current(...pendingArgsRef.current);
			pendingArgsRef.current = null;
		}
	}, []);

	const cancel = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = undefined;
		}
		pendingArgsRef.current = null;
	}, []);

	return { call, flush, cancel };
}
