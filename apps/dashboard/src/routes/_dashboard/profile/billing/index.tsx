import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/profile/billing/")({
   component: BillingPage,
});

export function BillingPage() {
   return <>oi</>;
}
