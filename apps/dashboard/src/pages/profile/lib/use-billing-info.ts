import { betterAuthClient } from "@/integrations/better-auth";
import type { IPolarSubscription } from "@/types";
import { useCallback, useEffect, useState } from "react";

export const useBillingInfo = () => {
   const [currentPlan, setCurrentPlan] = useState<IPolarSubscription | null>(
      null,
   );
   const [isLoading, setIsLoading] = useState(false);

   const getCurrentPlan = useCallback(async () => {
      setIsLoading(true);
      const { data } = await betterAuthClient.customer.subscriptions.list({
         query: {
            page: 1,
            limit: 10,
         },
      });

      setCurrentPlan(data?.result?.items[0] as IPolarSubscription);
      setIsLoading(false);
   }, []);

   useEffect(() => {
      getCurrentPlan();
   }, [getCurrentPlan]);

   return {
      currentPlan,
      isLoading,
   };
};
