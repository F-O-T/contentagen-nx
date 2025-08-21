import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import { AlertCircle, Crown, Loader2 } from "lucide-react";
import { useCallback } from "react";

export function ProfilePageBilling() {
   const trpc = useTRPC();
   const { data: customerState, isLoading } = useSuspenseQuery(
      trpc.authHelpers.getCustomerState.queryOptions(),
   );
   const activeSubscription = customerState?.activeSubscriptions[0];
   const activeMeter = customerState?.activeMeters[0];
   console.log(activeMeter);
   console.log(activeSubscription);
   const handleManageSubscription = useCallback(async () => {
      return await betterAuthClient.customer.portal();
   }, []);

   const goToCheckout = useCallback(async () => {
      return await betterAuthClient.checkout({
         slug: "basic",
      });
   }, []);

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center">
                  <div className="flex items-center gap-2">
                     Current plan
                     <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
               </CardTitle>
               <CardDescription>
                  <Skeleton className="h-4 w-64" />
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex items-center justify-between mb-6">
                  <div>
                     <Skeleton className="h-8 w-32 mb-2" />
                     <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <h4 className="font-medium text-foreground mb-3">
                        Plan Features
                     </h4>
                     <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                           <div key={i} className="flex items-center">
                              <Skeleton className="h-4 w-4 mr-2 rounded" />
                              <Skeleton className="h-4 w-full max-w-xs" />
                           </div>
                        ))}
                     </div>
                  </div>

                  <div>
                     <h4 className="font-medium text-foreground mb-3">
                        Usage This Month
                     </h4>
                     <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                           <div key={i}>
                              <div className="flex justify-between text-sm mb-1">
                                 <Skeleton className="h-4 w-24" />
                                 <Skeleton className="h-4 w-16" />
                              </div>
                              <Skeleton className="h-2 w-full rounded-full" />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="flex space-x-3 mt-6">
                  <Skeleton className="h-10 w-28" />
                  <Skeleton className="h-10 w-36" />
               </div>
            </CardContent>
         </Card>
      );
   }

   if (!activeSubscription) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>No active plan</CardTitle>
               <CardDescription>
                  You don't have an active subscription plan.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <Button onClick={goToCheckout}>
                  <Crown />
                  Go to Premium
               </Button>
            </CardContent>
         </Card>
      );
   }

   const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat("en-US", {
         style: "currency",
         currency: currency.toUpperCase(),
      }).format(amount / 100); // Assuming amount is in cents
   };

   const formatDate = (date: Date | null) => {
      if (!date) return "N/A";
      return new Intl.DateTimeFormat("en-US", {
         year: "numeric",
         month: "long",
         day: "numeric",
      }).format(new Date(date));
   };

   const calculateUsagePercentage = (consumed: number, credited: number) => {
      if (credited === 0) return 0;
      return Math.min((consumed / credited) * 100, 100);
   };

   const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
         case "active":
            return "bg-green-100 text-green-800";
         case "canceled":
            return "bg-red-100 text-red-800";
         case "past_due":
            return "bg-yellow-100 text-yellow-800";
         default:
            return "bg-gray-100 text-gray-800";
      }
   };

   const usagePercentage = calculateUsagePercentage(
      activeMeter?.consumedUnits ?? 0,
      activeMeter?.creditedUnits ?? 0,
   );
   const isNearLimit = usagePercentage > 80;

   return (
      <Card>
         <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>
               This is your current subscription plan details. You can manage
               your subscription or view usage metrics below.
            </CardDescription>
            <CardAction>
               <Button onClick={handleManageSubscription} variant="outline">
                  Manage subscription
               </Button>
            </CardAction>
         </CardHeader>
         <CardContent>
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-2xl font-bold text-foreground">
                     {formatCurrency(
                        activeSubscription.amount,
                        activeSubscription.currency,
                     )}
                     <span className="text-base font-normal text-foreground/70">
                        /{activeSubscription.recurringInterval}
                     </span>
                  </h3>
                  <p className="text-sm text-foreground/70">
                     Next billing date:{" "}
                     {formatDate(activeSubscription.currentPeriodEnd)}
                  </p>
               </div>
               <Badge
                  variant="secondary"
                  className={getStatusColor(activeSubscription.status)}
               >
                  {activeSubscription.status.charAt(0).toUpperCase() +
                     activeSubscription.status.slice(1)}
               </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <h4 className="font-medium text-foreground mb-3">
                     Usage this month
                  </h4>
                  <div className="space-y-4">
                     {activeMeter ? (
                        <div key={activeMeter.id}>
                           <div className="flex justify-between text-sm mb-1">
                              <span>
                                 {activeMeter.consumedUnits.toLocaleString()} /{" "}
                                 {activeMeter.creditedUnits === -1
                                    ? "∞"
                                    : activeMeter.creditedUnits.toLocaleString()}
                              </span>
                           </div>
                           <Progress value={usagePercentage} className="h-2" />
                           {isNearLimit && activeMeter.creditedUnits !== -1 && (
                              <p className="text-xs text-orange-600 mt-1 flex items-center">
                                 <AlertCircle className="h-3 w-3 mr-1" />
                                 Approaching limit
                              </p>
                           )}
                        </div>
                     ) : (
                        <p className="text-sm text-foreground/60">
                           No usage meters available for this plan.
                        </p>
                     )}
                  </div>
               </div>
            </div>
         </CardContent>
      </Card>
   );
}
