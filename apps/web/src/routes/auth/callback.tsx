import { createFileRoute, redirect } from '@tanstack/react-router'
import { authClient } from '@/integrations/better-auth/auth-client'

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

    // No organization exists — sign out to break the redirect loop
    // (the /auth parent redirects authenticated users back here,
    // so we must clear the session before redirecting to sign-in)
    await authClient.signOut()
    context.queryClient.removeQueries({
      queryKey: context.orpc.session.getSession.queryOptions().queryKey,
    })

    throw redirect({ to: '/auth/sign-in' })
  },
  component: () => null,
})
