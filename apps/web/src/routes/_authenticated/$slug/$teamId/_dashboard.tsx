import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { DashboardLayout } from '@/layout/dashboard/ui/dashboard-layout'

export const Route = createFileRoute('/_authenticated/$slug/$teamId/_dashboard')({
  beforeLoad: async ({ context, params }) => {
    const status = await context.queryClient.fetchQuery(
      context.orpc.onboarding.getOnboardingStatus.queryOptions(),
    )

    if (!status.organization.onboardingCompleted) {
      throw redirect({
        to: '/$slug/onboarding',
        params: { slug: params.slug },
      })
    }

    if (!status.project.onboardingCompleted) {
      throw redirect({
        to: '/$slug/$teamId/onboarding',
        params: { slug: params.slug, teamId: params.teamId },
      })
    }
  },
  component: DashboardLayoutRoute,
})

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
