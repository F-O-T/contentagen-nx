import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/project/access-control",
)({
   component: ProjectAccessControlPage,
});

function ProjectAccessControlPage() {
   return (
      <SettingsPlaceholderPage
         description="Gerencie quem pode acessar este projeto e suas permissões."
         title="Controle de acesso"
      />
   );
}
