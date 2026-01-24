import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/$slug')({
  beforeLoad: async ({ context, params }) => {
    // Fetch user's organizations
    const organizations = await context.queryClient.fetchQuery(
      context.orpc.organization.getOrganizations.queryOptions(),
    )

    // Find the organization matching the slug
    const currentOrganization = organizations.find(
      (org) => org.slug === params.slug,
    )

    // If slug is invalid, redirect to first valid org or sign-in
    if (!currentOrganization) {
      const firstOrg = organizations[0]
      if (firstOrg) {
        throw redirect({
          to: '/$slug/home',
          params: { slug: firstOrg.slug },
        })
      }
      // No organizations exist, redirect to sign-in
      throw redirect({ to: '/auth/sign-in' })
    }

    // Return organization data for child routes
    return {
      organizations,
      currentOrganization,
      organizationId: currentOrganization.id,
    }
  },
  component: OrganizationLayout,
})

function OrganizationLayout() {
  return <Outlet />
}
