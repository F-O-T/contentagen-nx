import { useTRPC } from "@/integrations/clients";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SubscriptionPricingCards } from "./subscription-pricing-cards";
import { useIsomorphicLayoutEffect } from "framer-motion";

export function SubscriptionReminderCredenza() {
   const trpc = useTRPC();
   const [open, setOpen] = useState(true);
   const { data } = useSuspenseQuery(
      trpc.authHelpers.getCustomerState.queryOptions(),
   );
   useIsomorphicLayoutEffect(() => {
      if (!data?.activeSubscriptions?.length) {
         setOpen(true);
      }
   }, [data?.activeSubscriptions]);

   return (
      <Credenza open={open} onOpenChange={setOpen}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>
                  You need an active plan to use the app
               </CredenzaTitle>
               <CredenzaDescription>
                  Please subscribe to one of our plans to continue using all the
                  features of the app.
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid gap-4">
               <SubscriptionPricingCards />
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
