import { betterAuthClient } from "@/integrations/better-auth";
import { ThemeToggler } from "@/layout/theme-provider";
import {
   Card,
   CardHeader,
   CardTitle,
   CardContent,
} from "@packages/ui/components/card";
import { SquaredIconButton } from "@packages/ui/components/squared-icon-button";
import { CreditCardIcon } from "lucide-react";
import { useCallback } from "react";

export function PreferencesSection() {
   const goToPortal = useCallback(async () => {
      return await betterAuthClient.customer.portal();
   }, []);
   return (
      <Card>
         <CardHeader>
            <CardTitle>Preferences</CardTitle>
         </CardHeader>
         <CardContent className="grid grid-cols-2 gap-4">
            <SquaredIconButton onClick={goToPortal}>
               <CreditCardIcon />
               Billing
            </SquaredIconButton>
            <ThemeToggler />
         </CardContent>
      </Card>
   );
}
