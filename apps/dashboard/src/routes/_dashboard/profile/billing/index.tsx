import { useBetterAuthSession } from "@/integrations/better-auth";
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
import { createFileRoute } from "@tanstack/react-router";
import {
   AlertCircle,
   Calendar,
   Check,
   CreditCard,
   Crown,
   Download,
   Plus,
   Trash2,
} from "lucide-react";

export const Route = createFileRoute("/_dashboard/profile/billing/")({
   component: BillingPage,
});

export function BillingPage() {
   const { polarCustomerState, isPolarLoading } = useBetterAuthSession();

   console.log("polarCustomerState", polarCustomerState);

   const currentSubscription = polarCustomerState?.subscriptions?.[0];

   if (isPolarLoading) {
      return <div>Loading billing information...</div>;
   }

   if (!polarCustomerState) {
      return <div>No billing information available.</div>;
   }

   return (
      <div className="space-y-6">
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-yellow-600" />
                  Current Plan
               </CardTitle>
               <CardDescription>
                  You're currently on the{" "}
                  {currentSubscription?.plan?.name ?? "No plan"} plan.
               </CardDescription>
            </CardHeader>
            {currentSubscription && (
               <CardContent>
                  <div className="flex items-center justify-between mb-6">
                     <div>
                        <h3 className="text-2xl font-bold">
                           ${currentSubscription.plan?.price}
                           <span className="text-base font-normal text-muted-foreground">
                              /{currentSubscription.plan?.interval}
                           </span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                           Next billing date:{" "}
                           {new Date(
                              currentSubscription.current_period_end * 1000,
                           ).toLocaleDateString()}
                        </p>
                     </div>
                     <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                     >
                        Active
                     </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <h4 className="font-medium mb-3">Plan Features</h4>
                        <ul className="space-y-2">
                           {currentSubscription.plan?.features.map(
                              (feature: string) => (
                                 <li
                                    key={feature}
                                    className="flex items-center text-sm text-muted-foreground"
                                 >
                                    <Check className="h-4 w-4 text-green-600 mr-2" />
                                    {feature}
                                 </li>
                              ),
                           )}
                        </ul>
                     </div>

                     <div>
                        <h4 className="font-medium mb-3">Usage This Month</h4>
                        <div className="space-y-4">
                           <div>
                              <div className="flex justify-between text-sm mb-1">
                                 <span>AI Agents</span>
                                 <span>
                                    {currentSubscription.usage?.agents} /{" "}
                                    {currentSubscription.plan?.limits
                                       ?.agents === -1
                                       ? "∞"
                                       : currentSubscription.plan?.limits
                                            ?.agents}
                                 </span>
                              </div>
                              <Progress
                                 value={
                                    (currentSubscription.usage?.agents /
                                       currentSubscription.plan?.limits
                                          ?.agents) *
                                    100
                                 }
                                 className="h-2"
                              />
                           </div>

                           <div>
                              <div className="flex justify-between text-sm mb-1">
                                 <span>Articles Generated</span>
                                 <span>
                                    {currentSubscription.usage?.articles} /{" "}
                                    {currentSubscription.plan?.limits?.articles}
                                 </span>
                              </div>
                              <Progress
                                 value={
                                    (currentSubscription.usage?.articles /
                                       currentSubscription.plan?.limits
                                          ?.articles) *
                                    100
                                 }
                                 className="h-2"
                              />
                              {currentSubscription.usage?.articles /
                                 currentSubscription.plan?.limits?.articles >
                                 80 && (
                                 <p className="text-xs text-orange-600 mt-1 flex items-center">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Approaching limit
                                 </p>
                              )}
                           </div>

                           <div>
                              <div className="flex justify-between text-sm mb-1">
                                 <span>Words Generated</span>
                                 <span>
                                    {currentSubscription.usage?.wordsGenerated.toLocaleString()}
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                     <Button variant="outline" onClick={() => {}}>
                        Manage Billing
                     </Button>
                     <Button variant="outline" onClick={() => {}}>
                        Cancel Subscription
                     </Button>
                  </div>
               </CardContent>
            )}
         </Card>

         {/* Available Plans */}
         <Card>
            <CardHeader>
               <CardTitle>Available Plans</CardTitle>
               <CardDescription>
                  Upgrade or downgrade your plan at any time.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {polarCustomerState?.subscriptions?.map(
                     (subscription, index) => (
                        <div
                           key={`${subscription.plan.id}-${index}`}
                           className={`border rounded-lg p-6 ${
                              subscription.plan.id ===
                              currentSubscription?.plan.id
                                 ? "border-primary bg-primary/5"
                                 : "border-border hover:border-primary/50"
                           }`}
                        >
                           <div className="flex items-center justify-between mb-4">
                              <h3 className="font-semibold">
                                 {subscription.plan.name}
                              </h3>
                              {subscription.plan.id ===
                                 currentSubscription?.plan.id && (
                                 <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary"
                                 >
                                    Current
                                 </Badge>
                              )}
                           </div>

                           <div className="mb-4">
                              <span className="text-3xl font-bold">
                                 ${subscription.plan.price}
                              </span>
                              <span className="text-muted-foreground">
                                 /{subscription.plan.interval}
                              </span>
                           </div>

                           <ul className="space-y-2 mb-6">
                              {subscription.plan.features
                                 .slice(0, 4)
                                 .map((feature: string) => (
                                    <li
                                       key={feature}
                                       className="flex items-center text-sm text-muted-foreground"
                                    >
                                       <Check className="h-4 w-4 text-green-600 mr-2" />
                                       {feature}
                                    </li>
                                 ))}
                              {subscription.plan.features.length > 4 && (
                                 <li className="text-sm text-muted-foreground">
                                    +{subscription.plan.features.length - 4}{" "}
                                    more features
                                 </li>
                              )}
                           </ul>

                           <Button
                              className="w-full"
                              variant={
                                 subscription.plan.id ===
                                 currentSubscription?.plan.id
                                    ? "outline"
                                    : "default"
                              }
                              disabled={
                                 subscription.plan.id ===
                                 currentSubscription?.plan.id
                              }
                              onClick={() => {}}
                           >
                              {subscription.plan.id ===
                              currentSubscription?.plan.id
                                 ? "Current Plan"
                                 : "Select Plan"}
                           </Button>
                        </div>
                     ),
                  )}
               </div>
            </CardContent>
         </Card>

         {/* Payment Methods */}
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Methods
               </CardTitle>
               <CardDescription>
                  Manage your payment methods and billing information.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {polarCustomerState?.customer?.paymentMethods.map(
                     (method: any) => (
                        <div
                           key={method.id}
                           className="flex items-center justify-between p-4 border rounded-lg"
                        >
                           <div className="flex items-center space-x-4">
                              <div className="w-12 h-8 bg-muted rounded flex items-center justify-center">
                                 <CreditCard className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                 <p className="font-medium">
                                    {method.brand.toUpperCase()} ••••{" "}
                                    {method.last4}
                                 </p>
                                 <p className="text-sm text-muted-foreground">
                                    Expires {method.expiryMonth}/
                                    {method.expiryYear}
                                 </p>
                              </div>
                              {method.isDefault && (
                                 <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                 >
                                    Default
                                 </Badge>
                              )}
                           </div>
                           <div className="flex items-center space-x-2">
                              {!method.isDefault && (
                                 <Button variant="outline" size="sm">
                                    Set Default
                                 </Button>
                              )}
                              <Button variant="outline" size="sm">
                                 <Trash2 className="h-4 w-4" />
                              </Button>
                           </div>
                        </div>
                     ),
                  )}

                  <Button
                     variant="outline"
                     className="w-full"
                     onClick={() => {}}
                  >
                     <Plus className="h-4 w-4 mr-2" />
                     Add Payment Method
                  </Button>
               </div>
            </CardContent>
         </Card>

         {/* Billing History */}
         <Card>
            <CardHeader>
               <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Billing History
               </CardTitle>
               <CardDescription>
                  View and download your past invoices.
               </CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {polarCustomerState?.customer?.invoices.map(
                     (invoice: any) => (
                        <div
                           key={invoice.id}
                           className="flex items-center justify-between p-4 border rounded-lg"
                        >
                           <div>
                              <p className="font-medium">
                                 {invoice.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                 {new Date(invoice.date).toLocaleDateString()}
                              </p>
                           </div>
                           <div className="flex items-center space-x-4">
                              <div className="text-right">
                                 <p className="font-medium">
                                    ${invoice.amount}
                                 </p>
                                 <Badge
                                    variant="secondary"
                                    className={
                                       invoice.status === "paid"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                    }
                                 >
                                    {invoice.status}
                                 </Badge>
                              </div>
                              <Button variant="outline" size="sm">
                                 <Download className="h-4 w-4 mr-2" />
                                 Download
                              </Button>
                           </div>
                        </div>
                     ),
                  )}
               </div>
            </CardContent>
         </Card>
      </div>
   );
}
