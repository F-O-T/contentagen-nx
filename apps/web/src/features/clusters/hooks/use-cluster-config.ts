import { useDebounce } from "@uidotdev/usehooks";
import { useCallback, useEffect, useState } from "react";

export type ClusterMode = "changelog" | "seo" | "series" | string;

export interface ClusterConfig {
   mode: ClusterMode;
   embedEnabled: boolean;
   embedSettings?: {
      theme: "light" | "dark" | "auto";
      label: string;
      accentColor: string;
   };
}

const DEFAULT_CONFIG: ClusterConfig = {
   mode: "seo",
   embedEnabled: false,
};

export function useClusterConfig(initialConfig?: Partial<ClusterConfig>) {
   const [config, setConfig] = useState<ClusterConfig>({
      ...DEFAULT_CONFIG,
      ...initialConfig,
   });
   const [pendingUpdates, setPendingUpdates] = useState<Partial<ClusterConfig>>(
      {},
   );
   const debouncedUpdates = useDebounce(pendingUpdates, 500);

   useEffect(() => {
      if (Object.keys(debouncedUpdates).length > 0) {
         setConfig((c) => ({ ...c, ...debouncedUpdates }));
         setPendingUpdates({});
      }
   }, [debouncedUpdates]);

   const updateConfig = useCallback((updates: Partial<ClusterConfig>) => {
      setPendingUpdates((prev) => ({ ...prev, ...updates }));
   }, []);

   const updateConfigImmediate = useCallback(
      (updates: Partial<ClusterConfig>) => {
         setConfig((prev) => ({ ...prev, ...updates }));
      },
      [],
   );

   const resetConfig = useCallback((newConfig: ClusterConfig) => {
      setConfig(newConfig);
      setPendingUpdates({});
   }, []);

   return { config, updateConfig, updateConfigImmediate, resetConfig };
}
