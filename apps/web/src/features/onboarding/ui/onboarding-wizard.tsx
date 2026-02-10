import { defineStepper } from "@packages/ui/components/stepper";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { ProductSelectionStep } from "./product-selection-step";
import { ProfileSetupStep } from "./profile-setup-step";
import { SdkInstallStep } from "./sdk-install-step";

const steps = [
   { id: "profile", title: "Perfil" },
   { id: "products", title: "Produtos" },
   { id: "sdk-install", title: "SDK" },
] as const;

const { Stepper } = defineStepper(...steps);

export function OnboardingWizard() {
   const navigate = useNavigate();
   const { slug } = useParams({ from: "/_authenticated/$slug/onboarding" });
   const { data: teams } = useQuery(
      orpc.organization.getOrganizationTeams.queryOptions({}),
   );

   const completeMutation = useMutation(
      orpc.onboarding.completeOnboarding.mutationOptions({
         onSuccess: () => {
            const teamId = teams?.[0]?.id ?? "";
            navigate({ to: "/$slug/$teamId/home", params: { slug, teamId } });
         },
         onError: (error) => {
            toast.error(error.message ?? "Erro ao concluir onboarding.");
         },
      }),
   );

   const handleComplete = useCallback(() => {
      completeMutation.mutate({});
   }, [completeMutation]);

   return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
         <div className="w-full max-w-lg space-y-8">
            {/* Brand */}
            <div className="text-center">
               <h1 className="font-serif text-3xl font-bold tracking-tight">
                  Contentta
               </h1>
            </div>

            {/* Stepper */}
            <Stepper.Provider variant="line">
               {({ methods }) => (
                  <div className="space-y-6">
                     <Stepper.Navigation>
                        {steps.map((step) => (
                           <Stepper.Step key={step.id} of={step.id} />
                        ))}
                     </Stepper.Navigation>

                     {methods.switch({
                        profile: () => (
                           <ProfileSetupStep
                              onNext={(newSlug) => {
                                 // Update the URL if the slug changed, then advance
                                 if (newSlug !== slug) {
                                    navigate({
                                       to: "/$slug/onboarding",
                                       params: { slug: newSlug },
                                       replace: true,
                                    });
                                 }
                                 methods.next();
                              }}
                           />
                        ),
                        products: () => (
                           <ProductSelectionStep
                              onNext={() => methods.next()}
                              onSkipToEnd={handleComplete}
                           />
                        ),
                        "sdk-install": () => <SdkInstallStep />,
                     })}
                  </div>
               )}
            </Stepper.Provider>
         </div>
      </div>
   );
}
