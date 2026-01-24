import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { orpc } from '../orpc/client'

export type RouterContext = {
  queryClient: QueryClient
  orpc: typeof orpc
}

export function getContext(): RouterContext {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection
        refetchOnWindowFocus: false, // Don't refetch on tab focus
        retry: 1, // Retry failed requests once
      },
    },
  })
  return {
    queryClient,
    orpc,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
