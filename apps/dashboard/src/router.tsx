import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

import type { QueryClient } from "@tanstack/react-query";
import type { TrpcClient, InternalTrpcClient } from "@/integrations/clients";
import { routeTree } from "./routeTree.gen";

export type RouterContext = {
   trpc: TrpcClient;
   trpcClient: InternalTrpcClient;
   queryClient: QueryClient;
   head: string;
};

export const createRouter = (context: Omit<RouterContext, "head">) => {
   const router = routerWithQueryClient(
      createTanstackRouter({
         context: {
            ...context,
            head: "",
         },
         defaultPreloadStaleTime: 0,
         routeTree,
         scrollRestoration: true,
         defaultPreload: "intent",
         defaultPreloadDelay: 0,
         defaultPendingMs: 0,
      }),
      context.queryClient,
   );

   return router;
};

declare module "@tanstack/react-router" {
   interface Register {
      router: ReturnType<typeof createRouter>;
   }
}
