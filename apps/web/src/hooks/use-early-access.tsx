import { useEarlyAccessFeatures } from "@packages/posthog/client";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
   createContext,
   type ReactNode,
   useCallback,
   useContext,
   useMemo,
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

const EarlyAccessContext = createContext<EarlyAccessContextValue | null>(null);

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
   const { features, enrolledFeatures, loaded, isEnrolled, updateEnrollment } =
      useEarlyAccessFeatures();

   const [dismissedFlags, setDismissedFlagsState] = useLocalStorage<string[]>(
      BANNER_DISMISSED_KEY,
      [],
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
