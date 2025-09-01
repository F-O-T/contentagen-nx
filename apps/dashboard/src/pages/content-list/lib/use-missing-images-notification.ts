import { useEffect, useMemo, useRef } from "react";
import { useTRPC } from "@/integrations/clients";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useMissingImagesNotification() {
   const trpc = useTRPC();
   const lastNotificationTime = useRef<number>(0);
   const lastMissingCount = useRef<number>(0);

   // Get user workflow preferences
   const { data: workflowPrefs } = useSuspenseQuery(
      trpc.preferences.getWorkflow.queryOptions(),
   );

   const shouldNotify = useMemo(() => {
      return workflowPrefs?.notifyMissingImages ?? false;
   }, [workflowPrefs]);

   const { data: missingImagesData } = useQuery(
      trpc.preferences.checkMissingImages.queryOptions(undefined, {
         enabled: shouldNotify,
      }),
   );

   useEffect(() => {
      if (
         shouldNotify &&
         missingImagesData &&
         missingImagesData.total > 0 &&
         (missingImagesData.total !== lastMissingCount.current ||
            Date.now() - lastNotificationTime.current > 1000 * 60 * 60) // 1 hour
      ) {
         toast.warning(
            `You have ${missingImagesData.total} posts missing image URLs.`,
            {
               duration: 10000,
            },
         );
         lastNotificationTime.current = Date.now();
         lastMissingCount.current = missingImagesData.total;
      }
   }, [missingImagesData, shouldNotify]);

   return {
      missingImagesCount: missingImagesData?.total ?? 0,
      missingImages: missingImagesData?.missingImages ?? [],
      isEnabled: workflowPrefs?.notifyMissingImages ?? false,
   };
}
