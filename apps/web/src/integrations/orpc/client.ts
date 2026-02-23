import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin } from "@orpc/client/plugins";
import type {
   InferRouterInputs,
   InferRouterOutputs,
   RouterClient,
} from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import router from "./router";
import type { ORPCContextWithAuth } from "./server";
import { auth, db, posthog } from "./server-instances";

const getORPCClient = createIsomorphicFn()
   .server(() =>
      createRouterClient(router, {
         context: async (): Promise<ORPCContextWithAuth> => {
            const headers = getRequestHeaders();
            let session = null;
            try {
               session = await auth.api.getSession({ headers });
            } catch {
               session = null;
            }
            return {
               headers,
               request: new Request("http://localhost"), // Placeholder for SSR
               auth,
               db,
               session,
               posthog,
            };
         },
      }),
   )
   .client((): RouterClient<typeof router> => {
      const link = new RPCLink({
         url: `${window.location.origin}/api/rpc`, // Use relative URL - SSR safe, no window reference needed
         plugins: [
            new BatchLinkPlugin({
               groups: [
                  {
                     condition: () => true,
                     context: {},
                  },
               ],
            }),
         ],
         fetch: (input, init) =>
            fetch(input, {
               ...init,
               credentials: "include",
            }),
      });
      return createORPCClient(link);
   });

export const client: RouterClient<typeof router> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);
export type Inputs = InferRouterInputs<typeof router>;
export type Outputs = InferRouterOutputs<typeof router>;
