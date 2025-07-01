import { betterAuthClient } from "@/integrations/better-auth";
import { ThemeToggler } from "@/layout/theme-provider";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CreditCardIcon, Crown } from "lucide-react";
import { useCallback } from "react";

export function PreferencesSection() {
   const {
      data: { data: customer },
   } = useSuspenseQuery({
      queryKey: ["customer"],
      queryFn: async () => {
         const customer = await betterAuthClient.customer.state();
         return customer;
      },
   });

   const goToCheckout = useCallback(async () => {
      return await betterAuthClient.checkout({
         products: ["fbe8829c-4cf2-4771-8309-8caa97c3b3fc"],
      });
   }, []);

   const goToPortal = useCallback(async () => {
      return await betterAuthClient.customer.portal();
   }, []);

   const isSubscribed = Number(customer?.activeSubscriptions?.length) > 0;

   return (
      <Card>
         <CardHeader>
            <CardTitle>Preferences</CardTitle>
         </CardHeader>
         <CardContent className="grid grid-cols-2 gap-4">
            <SquaredIconButton
               onClick={isSubscribed ? goToPortal : goToCheckout}
            >
               {isSubscribed ? <CreditCardIcon /> : <Crown />}
               {isSubscribed ? "Manage Subscription" : "Go to Premium"}
            </SquaredIconButton>
            <ThemeToggler />
         </CardContent>
      </Card>
   );
}
