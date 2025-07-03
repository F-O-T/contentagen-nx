import { betterAuthClient } from "@/integrations/better-auth";
import { useBillingInfo } from "@/pages/profile/lib/use-billing-info";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Progress } from "@packages/ui/components/progress";
import { Skeleton } from "@packages/ui/components/skeleton";
import { AlertCircle, Check, Crown, Loader2 } from "lucide-react";
import { useCallback } from "react";

export function ProfilePageBilling() {
   const { currentPlan, isLoading } = useBillingInfo();

   const handleManageSubscription = useCallback(async () => {
      return await betterAuthClient.customer.portal();
   }, []);

   if (isLoading) {
      return (
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-yellow-600" />
                  <div className="flex items-center gap-2">
                     Current Plan
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

   if (!currentPlan) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>No Active Plan</CardTitle>
               <CardDescription>
                  You don't have an active subscription plan.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <Button>Subscribe to a Plan</Button>
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

   return (
      <Card className="bg-secondary/10 border-none">
         <CardHeader>
            <CardTitle className="flex items-center">
               <Crown className="h-5 w-5 mr-2 text-yellow-600" />
               Current Plan
            </CardTitle>
            <CardDescription className="text-foreground/80">
               You're currently on the {currentPlan.product.name}.
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="flex items-center justify-between mb-6">
               <div>
                  <h3 className="text-2xl font-bold text-foreground">
                     {formatCurrency(currentPlan.amount, currentPlan.currency)}
                     <span className="text-base font-normal text-foreground/70">
                        /{currentPlan.recurringInterval}
                     </span>
                  </h3>
                  <p className="text-sm text-foreground/70">
                     Next billing date:{" "}
                     {formatDate(currentPlan.currentPeriodEnd)}
                  </p>
               </div>
               <Badge
                  variant="secondary"
                  className={getStatusColor(currentPlan.status)}
               >
                  {currentPlan.status.charAt(0).toUpperCase() +
                     currentPlan.status.slice(1)}
               </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <h4 className="font-medium text-foreground mb-3">
                     Plan Features
                  </h4>
                  <ul className="space-y-2">
                     {currentPlan.product.benefits.map((benefit) => (
                        <li
                           key={benefit.id}
                           className="flex items-center text-sm text-foreground/80"
                        >
                           <Check className="h-4 w-4 text-green-500 mr-2" />
                           {benefit.description}
                        </li>
                     ))}
                  </ul>
                  {currentPlan.product.description && (
                     <p className="text-sm text-foreground/70 mt-3">
                        {currentPlan.product.description}
                     </p>
                  )}
               </div>

               <div>
                  <h4 className="font-medium text-foreground mb-3">
                     Usage This Month
                  </h4>
                  <div className="space-y-4">
                     {currentPlan.meters.map((meterUsage) => {
                        const usagePercentage = calculateUsagePercentage(
                           meterUsage.consumedUnits,
                           meterUsage.creditedUnits,
                        );
                        const isNearLimit = usagePercentage > 80;

                        return (
                           <div key={meterUsage.id}>
                              <div className="flex justify-between text-sm mb-1">
                                 <span>{meterUsage.meter.name}</span>
                                 <span>
                                    {meterUsage.consumedUnits.toLocaleString()}{" "}
                                    /{" "}
                                    {meterUsage.creditedUnits === -1
                                       ? "∞"
                                       : meterUsage.creditedUnits.toLocaleString()}
                                 </span>
                              </div>
                              <Progress
                                 value={usagePercentage}
                                 className="h-2"
                              />
                              {isNearLimit &&
                                 meterUsage.creditedUnits !== -1 && (
                                    <p className="text-xs text-orange-600 mt-1 flex items-center">
                                       <AlertCircle className="h-3 w-3 mr-1" />
                                       Approaching limit
                                    </p>
                                 )}
                              {meterUsage.amount > 0 && (
                                 <p className="text-xs text-foreground/60 mt-1">
                                    Cost:{" "}
                                    {formatCurrency(
                                       meterUsage.amount,
                                       currentPlan.currency,
                                    )}
                                 </p>
                              )}
                           </div>
                        );
                     })}

                     {currentPlan.meters.length === 0 && (
                        <p className="text-sm text-foreground/60">
                           No usage meters available for this plan.
                        </p>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex space-x-3 mt-6">
               <Button onClick={handleManageSubscription} variant="outline">
                  Manage Subscription
               </Button>
            </div>
         </CardContent>
      </Card>
   );
}
