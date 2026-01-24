import { createFileRoute } from "@tanstack/react-router";
import { PreferencesSection } from "@/pages/settings/ui/preferences-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/preferences")({
   component: PreferencesSection,
   staticData: {
      breadcrumb: "Preferências",
   },
});
