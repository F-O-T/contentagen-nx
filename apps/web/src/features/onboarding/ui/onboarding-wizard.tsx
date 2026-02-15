import { defineStepper } from "@packages/ui/components/stepper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { useOnboardingStatus } from "../hooks/use-onboarding-status";
import { ProductSelectionStep } from "./product-selection-step";
import { ProfileSetupStep } from "./profile-setup-step";
import { ProjectSetupStep } from "./project-setup-step";
import { SdkInstallStep } from "./sdk-install-step";

// Organization onboarding steps
const orgSteps = [{ id: "org-profile", title: "Workspace" }] as const;

// Project onboarding steps
const projectSteps = [
   { id: "project-setup", title: "Projeto" },
   { id: "products", title: "Produtos" },
   { id: "sdk-install", title: "SDK" },
] as const;

const { Stepper: OrgStepper } = defineStepper(...orgSteps);
const { Stepper: ProjectStepper } = defineStepper(...projectSteps);

export function OnboardingWizard() {
   const navigate = useNavigate();
   const queryClient = useQueryClient();
   const { slug } = useParams({ from: "/_authenticated/$slug/onboarding" });
   const { data: status } = useOnboardingStatus();
   const { data: teams } = useQuery(
      orpc.organization.getOrganizationTeams.queryOptions({}),
   );

   // Determine which onboarding flow to show
   const onboardingMode = useMemo(() => {
      if (!status) return "loading";
      if (!status.organization.onboardingCompleted) return "organization";
      if (!status.project.onboardingCompleted) return "project";
      return "complete";
   }, [status]);

   const completeOrgMutation = useMutation(
      orpc.onboarding.completeOrgOnboarding.mutationOptions({
         onSuccess: () => {
            toast.success("Workspace configurado com sucesso!");
            // Invalidate the onboarding status query to trigger re-render
            // This will cause the wizard to show project onboarding
            queryClient.invalidateQueries(
               orpc.onboarding.getOnboardingStatus.queryOptions(),
            );
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao concluir configuração.");
         },
      }),
   );

   const completeProjectMutation = useMutation(
      orpc.onboarding.completeProjectOnboarding.mutationOptions({
         onSuccess: () => {
            const teamId = teams?.[0]?.id ?? "";
            navigate({ to: "/$slug/$teamId/home", params: { slug, teamId } });
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao concluir onboarding.");
         },
      }),
   );

   const handleCompleteOrg = useCallback(() => {
      completeOrgMutation.mutate({});
   }, [completeOrgMutation]);

   const handleCompleteProject = useCallback(() => {
      completeProjectMutation.mutate({});
   }, [completeProjectMutation]);

   if (onboardingMode === "loading") {
      return (
         <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">Carregando...</div>
         </div>
      );
   }

   return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
         <div className="w-full max-w-lg space-y-8">
            {/* Brand */}
            <div className="text-center">
               <h1 className="font-serif text-3xl font-bold tracking-tight">
                  Contentta
               </h1>
               <p className="mt-2 text-sm text-muted-foreground">
                  {onboardingMode === "organization"
                     ? "Configure seu workspace"
                     : "Configure seu projeto"}
               </p>
            </div>

            {/* Organization Onboarding */}
            {onboardingMode === "organization" && (
               <OrgStepper.Provider variant="line">
                  {({ methods }) => (
                     <div className="space-y-6">
                        <OrgStepper.Navigation>
                           {orgSteps.map((step) => (
                              <OrgStepper.Step key={step.id} of={step.id} />
                           ))}
                        </OrgStepper.Navigation>

                        {methods.switch({
                           "org-profile": () => (
                              <ProfileSetupStep
                                 onNext={(newSlug) => {
                                    // Update URL if slug changed
                                    if (newSlug !== slug) {
                                       navigate({
                                          to: "/$slug/onboarding",
                                          params: { slug: newSlug },
                                          replace: true,
                                       });
                                    }
                                    // Complete org onboarding
                                    handleCompleteOrg();
                                 }}
                              />
                           ),
                        })}
                     </div>
                  )}
               </OrgStepper.Provider>
            )}

            {/* Project Onboarding */}
            {onboardingMode === "project" && (
               <ProjectStepper.Provider variant="line">
                  {({ methods }) => (
                     <div className="space-y-6">
                        <ProjectStepper.Navigation>
                           {projectSteps.map((step) => (
                              <ProjectStepper.Step key={step.id} of={step.id} />
                           ))}
                        </ProjectStepper.Navigation>

                        {methods.switch({
                           "project-setup": () => (
                              <ProjectSetupStep onNext={() => methods.next()} />
                           ),
                           products: () => (
                              <ProductSelectionStep
                                 onNext={() => methods.next()}
                                 onSkipToEnd={handleCompleteProject}
                              />
                           ),
                           "sdk-install": () => <SdkInstallStep />,
                        })}
                     </div>
                  )}
               </ProjectStepper.Provider>
            )}
         </div>
      </div>
   );
}
