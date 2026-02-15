import { defineStepper } from "@packages/ui/components/stepper";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { orpc } from "@/integrations/orpc/client";
import { ProductSelectionStep } from "./product-selection-step";
import { ProjectSetupStep } from "./project-setup-step";
import { SdkInstallStep } from "./sdk-install-step";

const projectSteps = [
	{ id: "project-setup", title: "Projeto" },
	{ id: "products", title: "Produtos" },
	{ id: "sdk-install", title: "SDK" },
] as const;

const { Stepper } = defineStepper(...projectSteps);

export function ProjectOnboardingWizard() {
	const navigate = useNavigate();
	const { slug, teamId } = useParams({
		from: "/_authenticated/$slug/$teamId/onboarding",
	});

	const completeProjectMutation = useMutation(
		orpc.onboarding.completeProjectOnboarding.mutationOptions({
			onSuccess: () => {
				navigate({ to: "/$slug/$teamId/home", params: { slug, teamId } });
			},
			onError: (error) => {
				toast.error(error.message ?? "Erro ao concluir onboarding.");
			},
		}),
	);

	const handleCompleteProject = useCallback(() => {
		completeProjectMutation.mutate({});
	}, [completeProjectMutation]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-background px-4">
			<div className="w-full max-w-lg space-y-8">
				{/* Brand */}
				<div className="text-center">
					<h1 className="font-serif text-3xl font-bold tracking-tight">
						Contentta
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Configure seu projeto
					</p>
				</div>

				{/* Stepper */}
				<Stepper.Provider variant="line">
					{({ methods }) => (
						<div className="space-y-6">
							<Stepper.Navigation>
								{projectSteps.map((step) => (
									<Stepper.Step key={step.id} of={step.id} />
								))}
							</Stepper.Navigation>

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
				</Stepper.Provider>
			</div>
		</div>
	);
}
