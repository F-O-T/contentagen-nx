import { createORPCClient } from "@orpc/client";
import {
  BatchLinkPlugin
} from '@orpc/client/plugins'
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { createAuth } from "@packages/authentication/server";
import { createDb } from "@packages/database/client";
import { env } from "@packages/environment/server";
import { getElysiaPosthogConfig } from "@packages/posthog/server";
import type { ORPCContextWithAuth } from "./server";

import router from "./router";

// Create singleton instances for server-side
const db = createDb({ databaseUrl: env.DATABASE_URL });
const auth = createAuth({ db, env });
const posthog = getElysiaPosthogConfig(env);

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
      url: window.location.origin + "/api/rpc", // Use relative URL - SSR safe, no window reference needed
      plugins: [
        new BatchLinkPlugin
          ({
            groups
              : [
                {
                  condition
                    : options
                      => true,
                  context
                    : {} 
                }
              ]
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
