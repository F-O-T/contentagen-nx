import { createFileRoute } from "@tanstack/react-router";
import { ProfileSection } from "@/pages/settings/ui/profile-section";

export const Route = createFileRoute("/$slug/_dashboard/settings/profile")({
   component: ProfileSection,
   staticData: {
      breadcrumb: "Perfil",
   },
});
