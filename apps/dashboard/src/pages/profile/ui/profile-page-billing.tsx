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
import {
   AlertCircle,
   Check,
   Crown,
   Loader2,
   Sparkles,
   Zap,
} from "lucide-react";
import { useCallback, useMemo } from "react";

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

   const goToBasicCheckout = useCallback(async () => {
      return await betterAuthClient.checkout({
         slug: "basic",
      });
   }, []);

   const goToHobbyCheckout = useCallback(async () => {
      return await betterAuthClient.checkout({
         slug: "hobby",
      });
   }, []);

   const plans = useMemo(
      () => [
         {
            id: "hobby",
            name: "Hobby",
            icon: Sparkles,
            iconColor: "text-blue-500",
            badge: {
               text: "Free",
               variant: "secondary" as const,
               className: "bg-green-100 text-green-800",
            },
            description:
               "Perfect for getting started with basic content generation",
            features: [
               {
                  icon: Zap,
                  iconColor: "text-green-500",
                  text: "$1.00 included usage per month",
               },
               {
                  icon: AlertCircle,
                  iconColor: "text-muted-foreground",
                  text: "Usage beyond limit is not available",
               },
            ],
            cardClassName: `border-2 border-dashed ${
               activeSubscription?.amount === 100
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200"
            }`,
            isCurrentPlan: activeSubscription?.amount === 100,
         },
         {
            id: "basic",
            name: "Basic",
            icon: Crown,
            iconColor: "text-yellow-500",
            badge: {
               text: "Premium",
               variant: "secondary" as const,
               className: "bg-purple-100 text-purple-800",
            },
            description:
               "Full access with generous usage and pay-as-you-go flexibility",
            features: [
               {
                  icon: Zap,
                  iconColor: "text-blue-500",
                  text: "$5.00 included usage per month",
               },
               {
                  icon: Crown,
                  iconColor: "text-yellow-500",
                  text: "Everything after is charged on the meter",
               },
            ],
            cardClassName: `border-2 ${
               activeSubscription?.amount === 500
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-gray-200"
            }`,
            isCurrentPlan: activeSubscription?.amount === 500,
         },
      ],
      [activeSubscription],
   );

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
         <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
               <div className="mx-auto max-w-2xl space-y-6 text-center">
                  <h1 className="text-center text-4xl font-semibold lg:text-5xl">
                     Pricing that Scales with You
                  </h1>
                  <p>
                     Gemini is evolving to be more than just the models. It
                     supports an entire to the APIs and platforms helping
                     developers and businesses innovate.
                  </p>
               </div>

               <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
                  {/* Free/Hobby Plan */}
                  <div className="rounded-lg flex flex-col justify-between space-y-8 border p-6 md:col-span-2 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
                     <div className="space-y-4">
                        <div>
                           <h2 className="font-medium">Free</h2>
                           <span className="my-3 block text-2xl font-semibold">
                              $0 / mo
                           </span>
                           <p className="text-muted-foreground text-sm">
                              Per editor
                           </p>
                        </div>

                        <Button
                           onClick={goToHobbyCheckout}
                           variant="outline"
                           className="w-full"
                        >
                           Get Started
                        </Button>

                        <hr className="border-dashed" />

                        <ul className="list-outside space-y-3 text-sm">
                           {plans
                              .find((p) => p.id === "hobby")
                              ?.features.map((feature, index) => (
                                 <li
                                    key={index}
                                    className="flex items-center gap-2"
                                 >
                                    <Check className="size-3" />
                                    {feature.text}
                                 </li>
                              ))}
                        </ul>
                     </div>
                  </div>

                  {/* Pro/Basic Plan */}
                  <div className="dark:bg-muted rounded-lg border p-6 shadow-lg shadow-gray-950/5 md:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
                     <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-4">
                           <div>
                              <h2 className="font-medium">Pro</h2>
                              <span className="my-3 block text-2xl font-semibold">
                                 $19 / mo
                              </span>
                              <p className="text-muted-foreground text-sm">
                                 Per editor
                              </p>
                           </div>

                           <Button
                              onClick={goToBasicCheckout}
                              className="w-full"
                           >
                              Get Started
                           </Button>
                        </div>

                        <div>
                           <div className="text-sm font-medium">
                              Everything in free plus :
                           </div>

                           <ul className="mt-4 list-outside space-y-3 text-sm">
                              {plans
                                 .find((p) => p.id === "basic")
                                 ?.features.map((feature, index) => (
                                    <li
                                       key={index}
                                       className="flex items-center gap-2"
                                    >
                                       <Check className="size-3" />
                                       {feature.text}
                                    </li>
                                 ))}
                           </ul>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>
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
