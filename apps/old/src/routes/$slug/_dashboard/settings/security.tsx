import { createFileRoute } from "@tanstack/react-router";
import { SecuritySection } from "@/pages/settings/ui/security-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/security")({
   component: SecuritySection,
   staticData: {
      breadcrumb: "Segurança",
   },
});
