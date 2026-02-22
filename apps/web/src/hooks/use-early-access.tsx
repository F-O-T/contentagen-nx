import { useEarlyAccessFeatures } from "@packages/posthog/client";
import {
   createContext,
   type ReactNode,
   useCallback,
   useContext,
   useEffect,
   useMemo,
} from "react";
import { useSafeLocalStorage } from "@/hooks/use-local-storage";

type EnrolledFeaturesCache = Record<
   string,
   {
      enrolled: boolean;
      stage: "alpha" | "beta" | "concept" | "general-availability";
      name: string;
   }
>;

type EarlyAccessContextValue = {
   loaded: boolean;
   enrolledFeatures: Set<string>;
   features: ReturnType<typeof useEarlyAccessFeatures>["features"];
   isEnrolled: (flagKey: string) => boolean;
   getFeatureStage: (
      flagKey: string,
   ) => "alpha" | "beta" | "concept" | "general-availability" | null;
   updateEnrollment: (flagKey: string, isEnrolled: boolean) => void;
   isBannerVisible: boolean;
   dismissBanner: () => void;
};

const BANNER_DISMISSED_KEY = "contentta:early-access-banner-dismissed";
const ENROLLED_FEATURES_CACHE_KEY = "contentta:enrolled-features";

const EarlyAccessContext = createContext<EarlyAccessContextValue | null>(null);

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
   const { features, enrolledFeatures, loaded, updateEnrollment } =
      useEarlyAccessFeatures();

   const [dismissedFlags, setDismissedFlagsState] = useSafeLocalStorage<
      string[]
   >(BANNER_DISMISSED_KEY, []);

   const [enrolledCache, setEnrolledCache] =
      useSafeLocalStorage<EnrolledFeaturesCache>(
         ENROLLED_FEATURES_CACHE_KEY,
         {},
      );

   const cachedFeatures = useMemo(
      () =>
         Object.entries(enrolledCache).map(([flagKey, entry]) => ({
            flagKey,
            name: entry.name,
            stage: entry.stage,
            description: "",
            documentationUrl: null,
         })),
      [enrolledCache],
   );

   const cachedEnrolledFeatures = useMemo(() => {
      const next = new Set<string>();
      for (const [flagKey, entry] of Object.entries(enrolledCache)) {
         if (entry.enrolled) {
            next.add(flagKey);
         }
      }
      return next;
   }, [enrolledCache]);

   const resolvedFeatures = loaded ? features : cachedFeatures;
   const resolvedEnrolledFeatures = loaded
      ? enrolledFeatures
      : cachedEnrolledFeatures;

   const isEnrolledWithCache = useCallback(
      (flagKey: string) => resolvedEnrolledFeatures.has(flagKey),
      [resolvedEnrolledFeatures],
   );

   useEffect(() => {
      if (!loaded) return;
      const next: EnrolledFeaturesCache = {};
      for (const feature of features) {
         if (!feature.flagKey) continue;
         next[feature.flagKey] = {
            enrolled: enrolledFeatures.has(feature.flagKey),
            stage: feature.stage,
            name: feature.name,
         };
      }
      setEnrolledCache(next);
   }, [loaded, features, enrolledFeatures, setEnrolledCache]);

   const isBannerVisible = useMemo(() => {
      if (!loaded || resolvedFeatures.length === 0) return false;
      const dismissedSet = new Set(dismissedFlags);
      return resolvedFeatures.some(
         (f) =>
            f.flagKey &&
            !resolvedEnrolledFeatures.has(f.flagKey) &&
            !dismissedSet.has(f.flagKey),
      );
   }, [loaded, resolvedFeatures, resolvedEnrolledFeatures, dismissedFlags]);

   const dismissBanner = useCallback(() => {
      const allFlagKeys = resolvedFeatures
         .map((f) => f.flagKey)
         .filter((k): k is string => k !== null);
      setDismissedFlagsState(allFlagKeys);
   }, [resolvedFeatures, setDismissedFlagsState]);

   const getFeatureStage = useCallback(
      (flagKey: string) => {
         const feature = resolvedFeatures.find((f) => f.flagKey === flagKey);
         return feature?.stage ?? null;
      },
      [resolvedFeatures],
   );

   const updateEnrollmentWithCache = useCallback(
      (flagKey: string, isEnrolledValue: boolean) => {
         updateEnrollment(flagKey, isEnrolledValue);
         setEnrolledCache((prev) => {
            const existing = prev[flagKey];
            const stage = existing?.stage ?? getFeatureStage(flagKey) ?? "beta";
            const name = existing?.name ?? "";
            return {
               ...prev,
               [flagKey]: { enrolled: isEnrolledValue, stage, name },
            };
         });
      },
      [updateEnrollment, setEnrolledCache, getFeatureStage],
   );

   const value = useMemo<EarlyAccessContextValue>(
      () => ({
         loaded,
         enrolledFeatures: resolvedEnrolledFeatures,
         features: resolvedFeatures,
         isEnrolled: isEnrolledWithCache,
         getFeatureStage,
         updateEnrollment: updateEnrollmentWithCache,
         isBannerVisible,
         dismissBanner,
      }),
      [
         loaded,
         resolvedEnrolledFeatures,
         resolvedFeatures,
         isEnrolledWithCache,
         getFeatureStage,
         updateEnrollmentWithCache,
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
