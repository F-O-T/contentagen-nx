import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProjectOnboardingWizard } from "@/features/onboarding/ui/project-onboarding-wizard";

export const Route = createFileRoute("/_authenticated/$slug/$teamId/onboarding")({
	beforeLoad: async ({ context, params }) => {
		const status = await context.queryClient.fetchQuery(
			context.orpc.onboarding.getOnboardingStatus.queryOptions(),
		);

		// If org onboarding is not complete, redirect back to org onboarding
		if (!status.organization.onboardingCompleted) {
			throw redirect({
				to: "/$slug/onboarding",
				params: { slug: params.slug },
			});
		}

		// If project onboarding is complete, redirect to dashboard
		if (status.project.onboardingCompleted) {
			throw redirect({
				to: "/$slug/$teamId/home",
				params: { slug: params.slug, teamId: params.teamId },
			});
		}
	},
	component: ProjectOnboardingRoute,
});

function ProjectOnboardingRoute() {
	return <ProjectOnboardingWizard />;
}
