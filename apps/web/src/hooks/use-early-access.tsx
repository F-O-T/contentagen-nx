import { useEarlyAccessFeatures } from "@packages/posthog/client";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

type EarlyAccessContextValue = {
	loaded: boolean;
	enrolledFeatures: Set<string>;
	features: ReturnType<typeof useEarlyAccessFeatures>["features"];
	isEnrolled: (flagKey: string) => boolean;
	updateEnrollment: (flagKey: string, isEnrolled: boolean) => void;
	isBannerVisible: boolean;
	dismissBanner: () => void;
};

const BANNER_DISMISSED_KEY = "contentta:early-access-banner-dismissed";

function getDismissedFlags(): string[] {
	try {
		const stored = localStorage.getItem(BANNER_DISMISSED_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

function setDismissedFlags(flags: string[]) {
	try {
		localStorage.setItem(BANNER_DISMISSED_KEY, JSON.stringify(flags));
	} catch {
		// Silent fail on quota/unavailability
	}
}

const EarlyAccessContext = createContext<EarlyAccessContextValue | null>(null);

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
	const {
		features,
		enrolledFeatures,
		loaded,
		isEnrolled,
		updateEnrollment,
	} = useEarlyAccessFeatures();

	const [dismissedFlags, setDismissedFlagsState] = useState<string[]>(
		getDismissedFlags,
	);

	const isBannerVisible = useMemo(() => {
		if (!loaded || features.length === 0) return false;
		const dismissedSet = new Set(dismissedFlags);
		return features.some(
			(f) =>
				f.flagKey &&
				!enrolledFeatures.has(f.flagKey) &&
				!dismissedSet.has(f.flagKey),
		);
	}, [loaded, features, enrolledFeatures, dismissedFlags]);

	const dismissBanner = useCallback(() => {
		const allFlagKeys = features
			.map((f) => f.flagKey)
			.filter((k): k is string => k !== null);
		setDismissedFlagsState(allFlagKeys);
		setDismissedFlags(allFlagKeys);
	}, [features]);

	const value = useMemo<EarlyAccessContextValue>(
		() => ({
			loaded,
			enrolledFeatures,
			features,
			isEnrolled,
			updateEnrollment,
			isBannerVisible,
			dismissBanner,
		}),
		[
			loaded,
			enrolledFeatures,
			features,
			isEnrolled,
			updateEnrollment,
			isBannerVisible,
			dismissBanner,
		],
	);

	return (
		<EarlyAccessContext.Provider value={value}>
			{children}
		</EarlyAccessContext.Provider>
	);
}

export function useEarlyAccess() {
	const ctx = useContext(EarlyAccessContext);
	if (!ctx) {
		throw new Error("useEarlyAccess must be used within EarlyAccessProvider");
	}
	return ctx;
}
