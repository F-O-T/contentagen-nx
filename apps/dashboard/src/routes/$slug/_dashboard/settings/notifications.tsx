import { createFileRoute } from "@tanstack/react-router";
import { NotificationsSection } from "@/pages/settings/ui/notifications-section";

export const Route = createFileRoute(
   "/$slug/_dashboard/settings/notifications",
)({
   component: NotificationsSection,
   staticData: {
      breadcrumb: "Notificações",
   },
});
