import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, CreditCard } from "lucide-react";
import {
   Credenza,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Button } from "@packages/ui/components/button";
import {
   Alert,
   AlertDescription,
   AlertTitle,
} from "@packages/ui/components/alert";

interface SubscriptionReminderCredenzaProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

export function SubscriptionReminderCredenza({
   open,
   onOpenChange,
}: SubscriptionReminderCredenzaProps) {
   const router = useRouter();

   const handleGoToProfile = () => {
      router.navigate({ to: "/profile" });
      onOpenChange(false);
   };

   return (
      <Credenza open={open} onOpenChange={onOpenChange}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle className="flex items-center gap-2">
                  Active Subscription Required
               </CredenzaTitle>
               <CredenzaDescription>
                  To use the features of this app, you need an active
                  subscription
               </CredenzaDescription>
            </CredenzaHeader>

            <div className="space-y-4">
               <Alert>
                  <AlertTitle>Good news!</AlertTitle>
                  <AlertDescription>
                     We offer a free plan that doesn't require a credit card.
                     The free plan includes $1 of credits to get you started.
                  </AlertDescription>
               </Alert>

               <div className="text-sm text-muted-foreground">
                  <p>Upgrade your subscription on the profile page to:</p>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                     <li>Access all content generation features</li>
                     <li>Create and manage AI agents</li>
                     <li>Analyze competitors and generate insights</li>
                     <li>Export content in various formats</li>
                  </ul>
               </div>
            </div>

            <CredenzaFooter>
               <Button onClick={handleGoToProfile} className="w-full">
                  Go to Profile Page
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
}

