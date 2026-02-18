import { ADDON_IDS } from "@packages/stripe/constants";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { Suspense } from "react";
import { ProjectActivityLogs } from "@/features/activity-logs/ui/project-activity-logs";
import { useHasAddon } from "@/hooks/use-has-addon";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/activity-logs",
)({
   component: ProjectActivityLogsPage,
});

function ActivityLogsPageContent() {
   const { currentTeam } = Route.useRouteContext();
   const teamId = currentTeam.id;
   const hasScale = useHasAddon(ADDON_IDS.SCALE);

   if (hasScale) {
      return <ProjectActivityLogs teamId={teamId} />;
   }

   return (
      <SettingsAddonGatedPage
         addonDescription="O addon Scale desbloqueia o registro completo de atividades, permitindo rastrear todas as ações realizadas no projeto."
         addonName="Scale"
         description="Histórico completo de ações no projeto."
         features={[
            {
               title: "Histórico completo",
               description:
                  "Visualize todas as ações realizadas no projeto com data e autor",
            },
            {
               title: "Filtros avançados",
               description:
                  "Filtre atividades por tipo de ação, membro ou período",
            },
            {
               title: "Exportação de logs",
               description:
                  "Exporte o registro de atividades para análise externa",
            },
         ]}
         icon={ScrollText}
         title="Registro de Atividades"
      />
   );
}

function ProjectActivityLogsPage() {
   return (
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
         <ActivityLogsPageContent />
      </Suspense>
   );
}
