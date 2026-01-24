import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/callback')({
  beforeLoad: async ({ context }) => {
    // Fetch user's organizations to get the correct slug
    const organizations = await context.queryClient.fetchQuery(
      context.orpc.organization.getOrganizations.queryOptions(),
    )

    const firstSlug = organizations[0]?.slug

    if (firstSlug) {
      // Redirect to the dashboard home for the first organization
      throw redirect({
        to: '/$slug/home',
        params: { slug: firstSlug },
      })
    }

    // Fallback if no organization exists (shouldn't happen normally)
    throw redirect({ to: '/auth/sign-in' })
  },
  component: () => null,
})
