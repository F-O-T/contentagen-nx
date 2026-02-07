import { useCallback, useRef, useState } from "react";

export type InsightType = "trends" | "funnels" | "retention";

export interface TrendsConfig {
	events: Array<{ name: string; label: string }>;
	chartType: "line" | "bar" | "area" | "number";
	dateRange: string;
	breakdown?: string;
	filters: Array<{ property: string; operator: string; value: string }>;
}

export interface FunnelsConfig {
	steps: Array<{ event: string; label: string }>;
	conversionWindow: number;
	breakdown?: string;
}

export interface RetentionConfig {
	cohortEvent: string;
	returnEvent: string;
	period: "day" | "week" | "month";
}

export type InsightConfig = TrendsConfig | FunnelsConfig | RetentionConfig;

const DEFAULT_TRENDS_CONFIG: TrendsConfig = {
	events: [{ name: "content.page.view", label: "Page views" }],
	chartType: "line",
	dateRange: "last_30_days",
	filters: [],
};

const DEFAULT_FUNNELS_CONFIG: FunnelsConfig = {
	steps: [
		{ event: "content.page.view", label: "Page view" },
		{ event: "content.cta.click", label: "CTA click" },
	],
	conversionWindow: 14,
};

const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
	cohortEvent: "content.page.view",
	returnEvent: "content.page.view",
	period: "week",
};

export function useInsightConfig(initialType: InsightType = "trends") {
	const [type, setType] = useState<InsightType>(initialType);
	const [config, setConfig] = useState<InsightConfig>(DEFAULT_TRENDS_CONFIG);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleTypeChange = useCallback((newType: InsightType) => {
		setType(newType);
		switch (newType) {
			case "trends":
				setConfig(DEFAULT_TRENDS_CONFIG);
				break;
			case "funnels":
				setConfig(DEFAULT_FUNNELS_CONFIG);
				break;
			case "retention":
				setConfig(DEFAULT_RETENTION_CONFIG);
				break;
		}
	}, []);

	const updateConfig = useCallback((updates: Partial<InsightConfig>) => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}
		debounceRef.current = setTimeout(() => {
			setConfig((prev) => ({ ...prev, ...updates }));
		}, 500);
	}, []);

	const updateConfigImmediate = useCallback(
		(updates: Partial<InsightConfig>) => {
			setConfig((prev) => ({ ...prev, ...updates }));
		},
		[],
	);

	return {
		type,
		config,
		setType: handleTypeChange,
		updateConfig,
		updateConfigImmediate,
	};
}
