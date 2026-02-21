import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Spinner } from "@packages/ui/components/spinner";
import { defineStepper } from "@packages/ui/components/stepper";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import type { Session } from "@/integrations/better-auth/auth-client";
import { ProductsStep } from "./products-step";
import { ProfileStep } from "./profile-step";
import { ProjectStep } from "./project-step";
import type { StepHandle, StepState } from "./step-handle";
import { WorkspaceStep } from "./workspace-step";

type Organization = {
   id: string;
   name: string;
   slug: string;
   logo: string | null;
   role: string;
   onboardingCompleted: boolean | null;
};

interface OnboardingWizardProps {
   session: NonNullable<Session>;
   organizations: Organization[];
   activeOrg: Organization | null;
}

type WizardState = {
   organizationId: string | null;
   organizationSlug: string | null;
   teamId: string | null;
   teamSlug: string | null;
};

export function OnboardingWizard({
   session,
   organizations: _organizations,
   activeOrg,
}: OnboardingWizardProps) {
   const navigate = useNavigate();

   const needsProfile = !session.user.name;
   const needsWorkspace = !activeOrg;

   const steps = useMemo(() => {
      const s: { id: string; title: string }[] = [];
      if (needsProfile) s.push({ id: "profile", title: "Perfil" });
      if (needsWorkspace) s.push({ id: "workspace", title: "Workspace" });
      s.push({ id: "project", title: "Projeto" });
      s.push({ id: "products", title: "Produtos" });
      return s;
   }, [needsProfile, needsWorkspace]);

   const { Stepper } = useMemo(() => defineStepper(...steps), [steps]);

   const [wizardState, setWizardState] = useState<WizardState>({
      organizationId: activeOrg?.id ?? null,
      organizationSlug: activeOrg?.slug ?? null,
      teamId: null,
      teamSlug: null,
   });

   const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(
      activeOrg?.slug ?? null,
   );
   const [projectSlug, setProjectSlug] = useState<string | null>(null);

   const stepRef = useRef<StepHandle>(null);
   const [submitPending, startTransition] = useTransition();

   const [stepState, setStepState] = useState<StepState>({
      canContinue: true,
      isPending: false,
   });

   const handleStepStateChange = useCallback((state: StepState) => {
      setStepState(state);
   }, []);

   const handleProfileComplete = useCallback(
      (methods: { navigation: { next: () => void } }) => {
         methods.navigation.next();
      },
      [],
   );

   const handleWorkspaceComplete = useCallback(
      (
         org: { id: string; slug: string },
         methods: { navigation: { next: () => void } },
      ) => {
         setWizardState((prev) => ({
            ...prev,
            organizationId: org.id,
            organizationSlug: org.slug,
         }));
         methods.navigation.next();
      },
      [],
   );

   const handleProjectComplete = useCallback(
      (
         team: { id: string; slug: string },
         methods: { navigation: { next: () => void } },
      ) => {
         setWizardState((prev) => ({
            ...prev,
            teamId: team.id,
            teamSlug: team.slug,
         }));
         methods.navigation.next();
      },
      [],
   );

   const handleOnboardingComplete = useCallback(
      (slug: string, teamSlug: string) => {
         navigate({
            to: "/$slug/$teamSlug/home",
            params: { slug, teamSlug },
         });
      },
      [navigate],
   );

   return (
      <Stepper.Provider
         className="mx-auto flex min-h-screen max-w-6xl flex-col"
         variant="line"
      >
         {({ methods }) => {
            const isFirstStep = methods.state.isFirst;
            const isLastStep = methods.state.isLast;

            const handleContinue = () => {
               startTransition(async () => {
                  await stepRef.current?.submit();
               });
            };

            const handleBack = () => {
               methods.navigation.prev();
            };

            return (
               <>
                  {/* Header: stepper + logo */}
                  <header className="shrink-0 border-b p-4">
                     <div className="mx-auto flex w-full  items-center gap-4">
                        <Stepper.Navigation className="flex-1">
                           {steps.map((step) => (
                              <Stepper.Step key={step.id} of={step.id} />
                           ))}
                        </Stepper.Navigation>
                        <div className="flex shrink-0 items-center gap-2">
                           <img
                              alt="Contentta"
                              className="size-8 shrink-0 rounded-full"
                              src="/favicon.svg"
                           />
                           <Badge
                              className="bg-muted text-muted-foreground"
                              variant="outline"
                           >
                              app.contentta.co
                              {workspaceSlug ? `/${workspaceSlug}` : ""}
                              {projectSlug ? `/${projectSlug}` : ""}
                           </Badge>
                        </div>
                     </div>
                  </header>

                  {/* Main: step content centered */}
                  <main className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
                     <div
                        className="w-full animate-in fade-in slide-in-from-bottom-2 duration-200"
                        key={methods.state.current.data.id}
                     >
                        {methods.flow.switch({
                           ...(needsProfile
                              ? {
                                   profile: () => (
                                      <ProfileStep
                                         defaultName={session.user.name ?? ""}
                                         onNext={() =>
                                            handleProfileComplete(methods)
                                         }
                                         onStateChange={handleStepStateChange}
                                         ref={stepRef}
                                      />
                                   ),
                                }
                              : {}),
                           ...(needsWorkspace
                              ? {
                                   workspace: () => (
                                      <WorkspaceStep
                                         onNext={(org) =>
                                            handleWorkspaceComplete(
                                               org,
                                               methods,
                                            )
                                         }
                                         onSlugChange={setWorkspaceSlug}
                                         onStateChange={handleStepStateChange}
                                         ref={stepRef}
                                      />
                                   ),
                                }
                              : {}),
                           project: () => (
                              <ProjectStep
                                 onNext={(team) =>
                                    handleProjectComplete(team, methods)
                                 }
                                 onSlugChange={setProjectSlug}
                                 onStateChange={handleStepStateChange}
                                 organizationId={
                                    wizardState.organizationId ?? ""
                                 }
                                 ref={stepRef}
                              />
                           ),
                           products: () => (
                              <ProductsStep
                                 isPending={submitPending}
                                 onComplete={handleOnboardingComplete}
                                 onStateChange={handleStepStateChange}
                                 organizationId={
                                    wizardState.organizationId ?? ""
                                 }
                                 ref={stepRef}
                                 teamId={wizardState.teamId ?? ""}
                                 teamSlug={wizardState.teamSlug ?? ""}
                              />
                           ),
                        })}
                     </div>
                  </main>

                  {/* Footer: back/continue buttons */}
                  <footer className="shrink-0 border-t px-4 py-4">
                     <div className="mx-auto flex w-full  gap-3">
                        {!isFirstStep && (
                           <Button
                              className="h-11"
                              disabled={stepState.isPending}
                              onClick={handleBack}
                              type="button"
                              variant="outline"
                           >
                              Voltar
                           </Button>
                        )}
                        <Button
                           className="h-11 flex-1"
                           disabled={
                              stepState.isPending || !stepState.canContinue
                           }
                           onClick={handleContinue}
                           type="button"
                        >
                           {stepState.isPending ? (
                              <Spinner className="size-4" />
                           ) : isLastStep ? (
                              "Concluir"
                           ) : (
                              "Continuar"
                           )}
                        </Button>
                     </div>
                  </footer>
               </>
            );
         }}
      </Stepper.Provider>
   );
}
