import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_ERROR_THRESHOLD, API_ERROR_WINDOW_MS } from "../constants";

export function useApiErrorTracker() {
   const queryClient = useQueryClient();
   const errorsRef = useRef<number[]>([]);
   const [shouldShowBugReport, setShouldShowBugReport] = useState(false);
   const dismissedRef = useRef(false);

   const trackError = useCallback(() => {
      if (dismissedRef.current) return;

      const now = Date.now();
      errorsRef.current.push(now);

      // Remove errors outside the window
      errorsRef.current = errorsRef.current.filter(
         (t) => now - t < API_ERROR_WINDOW_MS,
      );

      if (errorsRef.current.length >= API_ERROR_THRESHOLD) {
         setShouldShowBugReport(true);
      }
   }, []);

   useEffect(() => {
      const queryCache = queryClient.getQueryCache();
      const mutationCache = queryClient.getMutationCache();

      const unsubQuery = queryCache.subscribe((event) => {
         if (event.type === "updated" && event.query.state.status === "error") {
            trackError();
         }
      });

      const unsubMutation = mutationCache.subscribe((event) => {
         if (
            event.type === "updated" &&
            event.mutation?.state.status === "error"
         ) {
            trackError();
         }
      });

      return () => {
         unsubQuery();
         unsubMutation();
      };
   }, [queryClient, trackError]);

   const dismiss = useCallback(() => {
      dismissedRef.current = true;
      setShouldShowBugReport(false);
      errorsRef.current = [];
   }, []);

   const reset = useCallback(() => {
      dismissedRef.current = false;
      errorsRef.current = [];
      setShouldShowBugReport(false);
   }, []);

   return { shouldShowBugReport, dismiss, reset };
}
