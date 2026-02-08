import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/personal-api-keys",
)({
   component: PersonalApiKeysPage,
});

function PersonalApiKeysPage() {
   return (
      <SettingsPlaceholderPage
         description="Gerencie suas chaves de API pessoais para acesso direto à API."
         title="Chaves de API pessoais"
      />
   );
}
