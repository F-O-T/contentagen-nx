import { defineStepper } from "@packages/ui/components/stepper";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { OrganizationProfileStep } from "./organization-profile-step";

const orgSteps = [{ id: "profile", title: "Workspace" }] as const;
const { Stepper } = defineStepper(...orgSteps);

export function OrganizationOnboardingWizard() {
	const navigate = useNavigate();
	const { slug } = useParams({ from: "/_authenticated/$slug/onboarding/" });
	const { data: teams } = useQuery(
		orpc.organization.getOrganizationTeams.queryOptions({}),
	);

	const completeMutation = useMutation(
		orpc.onboarding.completeOrgOnboarding.mutationOptions({
			onSuccess: () => {
				toast.success("Workspace configurado com sucesso!");
				const teamId = teams?.[0]?.id;
				if (teamId) {
					navigate({
						to: "/$slug/$teamId/onboarding",
						params: { slug, teamId },
					});
				}
			},
			onError: (error) => {
				toast.error(error.message ?? "Erro ao concluir configuração.");
			},
		}),
	);

	const handleComplete = useCallback(
		(newSlug: string) => {
			if (newSlug !== slug) {
				navigate({
					to: "/$slug/onboarding",
					params: { slug: newSlug },
					replace: true,
				});
			}
			completeMutation.mutate({});
		},
		[completeMutation, navigate, slug],
	);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-lg space-y-8">
				{/* Brand */}
				<div className="text-center">
					<h1 className="font-serif text-3xl font-bold tracking-tight">
						Contentta
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Configure seu workspace
					</p>
				</div>

				{/* Stepper */}
				<Stepper.Provider variant="line">
					{({ methods }) => (
						<div className="space-y-6">
							<Stepper.Navigation>
								{orgSteps.map((step) => (
									<Stepper.Step key={step.id} of={step.id} />
								))}
							</Stepper.Navigation>

							{methods.switch({
								profile: () => <OrganizationProfileStep onNext={handleComplete} />,
							})}
						</div>
					)}
				</Stepper.Provider>
			</div>
		</div>
	);
}
