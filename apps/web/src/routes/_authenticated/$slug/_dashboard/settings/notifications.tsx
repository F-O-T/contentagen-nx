import { createFileRoute } from "@tanstack/react-router";
import { SettingsPlaceholderPage } from "@/layout/dashboard/ui/settings-placeholder-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/_dashboard/settings/notifications",
)({
   component: NotificationsPage,
});

function NotificationsPage() {
   return (
      <SettingsPlaceholderPage
         description="Configure suas preferências de notificação por e-mail e no aplicativo."
         title="Notificações"
      />
   );
}
