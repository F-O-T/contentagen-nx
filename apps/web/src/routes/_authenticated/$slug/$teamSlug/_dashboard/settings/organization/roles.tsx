import { ADDON_IDS } from "@packages/stripe/constants";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { UserCog } from "lucide-react";
import { Suspense } from "react";
import { OrganizationRoles } from "@/features/roles/ui/organization-roles";
import { useHasAddon } from "@/hooks/use-has-addon";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/roles",
)({
   component: OrgRolesPage,
});

function RolesPageContent() {
   const hasEnterprise = useHasAddon(ADDON_IDS.ENTERPRISE);

   if (hasEnterprise) {
      return <OrganizationRoles />;
   }

   return (
      <SettingsAddonGatedPage
         addonDescription="O addon Enterprise desbloqueia funções personalizadas, permitindo criar permissões granulares para diferentes tipos de usuários."
         addonName="Enterprise"
         description="Crie funções customizadas com permissões específicas."
         features={[
            {
               title: "Funções ilimitadas",
               description:
                  "Crie quantas funções personalizadas precisar para sua organização",
            },
            {
               title: "Permissões granulares",
               description:
                  "Controle acesso por recurso: criar, editar, visualizar, deletar",
            },
            {
               title: "Atribuição flexível",
               description:
                  "Atribua múltiplas funções a um mesmo membro conforme necessário",
            },
         ]}
         icon={UserCog}
         title="Funções"
      />
   );
}

function OrgRolesPage() {
   return (
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
         <RolesPageContent />
      </Suspense>
   );
}
