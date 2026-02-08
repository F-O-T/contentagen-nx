import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/$slug/onboarding")({
	beforeLoad: async ({ context, params }) => {
		const status = await context.queryClient.fetchQuery(
			context.orpc.onboarding.getOnboardingStatus.queryOptions(),
		);

		if (status.onboardingCompleted) {
			throw redirect({
				to: "/$slug/home",
				params: { slug: params.slug },
			});
		}
	},
	component: OnboardingRoute,
});

function OnboardingRoute() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p>Onboarding</p>
		</div>
	);
}
