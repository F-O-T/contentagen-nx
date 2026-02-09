import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/webhooks",
)({
   component: ProjectWebhooksPage,
});

function ProjectWebhooksPage() {
   return (
      <SettingsPlaceholderPage
         description="Configure endpoints de webhook e configurações de entrega."
         title="Webhooks"
      />
   );
}
