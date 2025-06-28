import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import * as Eden from "./integrations/eden";
import * as TanstackQuery from "./integrations/tanstack-query";
import { routeTree } from "./routeTree.gen";
export const createRouter = () => {
  const router = routerWithQueryClient(
    createTanstackRouter({
      context: {
        ...Eden.getContext(),
        ...TanstackQuery.getContext(),
      },
      defaultPreloadStaleTime: 0,
      routeTree,
      scrollRestoration: true,
    }),
    TanstackQuery.getContext().queryClient,
  );

  return router;
};

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
