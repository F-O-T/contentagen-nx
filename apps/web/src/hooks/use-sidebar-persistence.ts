const STORAGE_KEY = "contentta:sidebar-collapsed";

export function getSidebarDefaultOpen(): boolean {
	if (typeof window === "undefined") return true;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === null) return true;
		return stored !== "true";
	} catch {
		return true;
	}
}

export function persistSidebarState(open: boolean) {
	try {
		localStorage.setItem(STORAGE_KEY, String(!open));
	} catch {
		// Silently fail if localStorage is unavailable
	}
}
