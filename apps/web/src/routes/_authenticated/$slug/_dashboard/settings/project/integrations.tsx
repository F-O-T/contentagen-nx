import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/integrations",
)({
   component: ProjectIntegrationsPage,
});

function ProjectIntegrationsPage() {
   return (
      <SettingsPlaceholderPage
         description="Conecte serviços de terceiros ao seu projeto."
         title="Integrações"
      />
   );
}
