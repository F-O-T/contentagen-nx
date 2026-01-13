import { createFileRoute } from "@tanstack/react-router";
import { UsageSection } from "@/pages/settings/ui/usage-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/usage")({
   component: UsageSection,
   staticData: {
      breadcrumb: "Uso de IA",
   },
});
