import { createRouter, Link } from "@tanstack/react-router";

import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

function NotFound() {
   return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
         <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
         <p className="text-lg text-gray-600 mb-6">Page not found</p>
         <Link
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            to="/"
         >
            Go Home
         </Link>
      </div>
   );
}

// Create a new router instance
export const getRouter = () => {
   const rqContext = TanstackQuery.getContext();

   const router = createRouter({
      routeTree,
      context: {
         ...rqContext,
      },

      defaultPreload: "intent",
      defaultNotFoundComponent: NotFound,
   });

   setupRouterSsrQueryIntegration({
      router,
      queryClient: rqContext.queryClient,
   });

   return router;
};
