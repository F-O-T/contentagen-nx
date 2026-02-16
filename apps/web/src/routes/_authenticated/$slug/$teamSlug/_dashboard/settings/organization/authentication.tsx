import { ADDON_IDS } from "@packages/stripe/constants";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { Suspense } from "react";
import { OrganizationAuthentication } from "@/features/sso/ui/organization-authentication";
import { useHasAddon } from "@/hooks/use-has-addon";
import { SettingsAddonGatedPage } from "@/layout/dashboard/ui/settings-addon-gated-page";

export const Route = createFileRoute(
   "/_authenticated/$slug/$teamSlug/_dashboard/settings/organization/authentication",
)({
   component: OrgAuthenticationPage,
});

function AuthenticationPageContent() {
   const hasEnterprise = useHasAddon(ADDON_IDS.ENTERPRISE);

   if (hasEnterprise) {
      return <OrganizationAuthentication />;
   }

   return (
      <SettingsAddonGatedPage
         addonDescription="O addon Enterprise desbloqueia SSO e autenticação por domínio, permitindo integração com provedores como Okta, Azure AD e Google Workspace."
         addonName="Enterprise"
         description="SSO e autenticação empresarial."
         features={[
            {
               title: "SAML 2.0 e OIDC",
               description:
                  "Integre com Okta, Azure AD, Google Workspace e outros provedores",
            },
            {
               title: "Domínios verificados",
               description:
                  "Verifique domínios e permita auto-join para emails corporativos",
            },
            {
               title: "Autenticação forçada",
               description: "Exija SSO para todos os membros da organização",
            },
         ]}
         icon={Globe}
         title="Autenticação e SSO"
      />
   );
}

function OrgAuthenticationPage() {
   return (
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
         <AuthenticationPageContent />
      </Suspense>
   );
}
