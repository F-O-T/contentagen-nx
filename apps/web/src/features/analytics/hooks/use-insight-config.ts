import type {
   FunnelsConfig,
   InsightConfig,
   RetentionConfig,
   TrendsConfig,
} from "@packages/analytics/types";
import { useCallback, useRef, useState } from "react";

export type InsightType = "trends" | "funnels" | "retention";

const DEFAULT_TRENDS_CONFIG: TrendsConfig = {
   type: "trends",
   series: [{ event: "content.page.view", math: "count", label: "Page views" }],
   chartType: "line",
   dateRange: { type: "relative", value: "30d" },
   interval: "day",
   compare: false,
   filters: [],
};

const DEFAULT_FUNNELS_CONFIG: FunnelsConfig = {
   type: "funnels",
   steps: [
      { event: "content.page.view", label: "Page view", filters: [] },
      { event: "content.cta.click", label: "CTA click", filters: [] },
   ],
   conversionWindow: { value: 14, unit: "day" },
   dateRange: { type: "relative", value: "30d" },
   exclusions: [],
   compare: false,
};

const DEFAULT_RETENTION_CONFIG: RetentionConfig = {
   type: "retention",
   startEvent: { event: "content.page.view" },
   returnEvent: { event: "content.page.view" },
   period: "week",
   totalPeriods: 8,
   dateRange: { type: "relative", value: "90d" },
   compare: false,
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
