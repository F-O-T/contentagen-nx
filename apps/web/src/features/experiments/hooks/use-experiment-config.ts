import { useCallback, useState } from "react";

export type ExperimentTargetType = "content" | "form" | "cluster";
export type ExperimentGoal =
   | "conversion"
   | "ctr"
   | "time_on_page"
   | "form_submit";
export type ExperimentStatus = "draft" | "running" | "paused" | "concluded";

export interface ExperimentConfig {
   name: string;
   hypothesis: string;
   targetType: ExperimentTargetType;
   goal: ExperimentGoal;
}

const DEFAULT_CONFIG: ExperimentConfig = {
   name: "",
   hypothesis: "",
   targetType: "content",
   goal: "conversion",
};

export function useExperimentConfig(initial?: Partial<ExperimentConfig>) {
   const [config, setConfig] = useState<ExperimentConfig>({
      ...DEFAULT_CONFIG,
      ...initial,
   });

   const updateConfig = useCallback((updates: Partial<ExperimentConfig>) => {
      setConfig((prev) => ({ ...prev, ...updates }));
   }, []);

   const setName = useCallback((name: string) => {
      setConfig((prev) => ({ ...prev, name }));
   }, []);

   return { config, updateConfig, setName };
}
