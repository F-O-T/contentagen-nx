import { ADDON_IDS } from "@packages/stripe/constants";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { ProjectAccessControl } from "@/features/access-control/ui/project-access-control";
import { useHasAddon } from "@/hooks/use-has-addon";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/project/access-control",
)({
   component: ProjectAccessControlPage,
});

function AccessControlPageContent() {
   const { currentTeam } = Route.useRouteContext();
   const teamId = currentTeam.id;
   const hasBoost = useHasAddon(ADDON_IDS.BOOST);

   if (hasBoost) {
      return <ProjectAccessControl teamId={teamId} />;
   }

   return (
      <SettingsAddonGatedPage
         addonDescription="O addon Boost desbloqueia controle de acesso granular, permitindo definir quem pode fazer o quê dentro de cada projeto."
         addonName="Boost"
         description="Defina permissões granulares por projeto."
         features={[
            {
               title: "Permissões por projeto",
               description:
                  "Defina quem pode visualizar, editar ou gerenciar cada projeto individualmente",
            },
            {
               title: "Grupos de acesso",
               description:
                  "Organize membros em grupos com permissões pré-definidas",
            },
            {
               title: "Auditoria de acesso",
               description:
                  "Acompanhe quem acessou e modificou recursos do projeto",
            },
         ]}
         icon={ShieldCheck}
         title="Controle de Acesso"
      />
   );
}

function ProjectAccessControlPage() {
   return (
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
         <AccessControlPageContent />
      </Suspense>
   );
}
