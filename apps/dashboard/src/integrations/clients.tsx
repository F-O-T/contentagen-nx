import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { clientEnv } from "@packages/environment/client";
import { createAuthClient } from "@packages/authentication/client";
import { createTrpcClient } from "@packages/api/client";
import type { AppRouter } from "@packages/api/server";
import {
   createTRPCContext,
   createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { useState } from "react";

export const { TRPCProvider, useTRPC, useTRPCClient } =
   createTRPCContext<AppRouter>();

function makeTrpcClient() {
   return createTrpcClient({
      serverUrl: `${clientEnv.VITE_SERVER_URL}`,
   });
}

export const betterAuthClient = createAuthClient({
   apiBaseUrl: clientEnv.VITE_SERVER_URL,
});

function makeQueryClient() {
   return new QueryClient({
      defaultOptions: {
         queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000,
         },
      },
   });
}
let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
   if (typeof window === "undefined") {
      // Server: always make a new query client
      return makeQueryClient();
   } else {
      // Browser: make a new query client if we don't already have one
      // This is very important, so we don't re-make a new client if React
      // suspends during the initial render. This may not be needed if we
      // have a suspense boundary BELOW the creation of the query client
      if (!browserQueryClient) browserQueryClient = makeQueryClient();
      return browserQueryClient;
   }
}

export const trpc = createTRPCOptionsProxy<AppRouter>({
   client: makeTrpcClient(),
   queryClient: getQueryClient(),
});
export function getContext() {
   return {
      trpc,
      queryClient: getQueryClient(),
   };
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
   const queryClient = getQueryClient();
   const [trpcClient] = useState(() => makeTrpcClient());
   return (
      <QueryClientProvider client={queryClient}>
         <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <ReactQueryDevtools buttonPosition="bottom-right" />
            {children}
         </TRPCProvider>
      </QueryClientProvider>
   );
}
export type Session = typeof betterAuthClient.$Infer.Session;
export type TrpcClient = typeof trpc;
