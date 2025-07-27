import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const queryClient = new QueryClient();

export function getContext() {
   return {
      queryClient,
   };
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
   return (
      <QueryClientProvider client={queryClient}>
         <ReactQueryDevtools buttonPosition="bottom-right" />
         {children}
      </QueryClientProvider>
   );
}
