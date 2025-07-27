import { createTRPCClient, httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";
import urlJoin from "url-join";
import type { AppRouter } from "../server";

export interface APIClientOptions {
  serverUrl: string;
  headers?: Record<string, string> | Headers;
}
export const createTrpcClient = ({ serverUrl, headers }: APIClientOptions) => {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: urlJoin(serverUrl, "/trpc"),
        transformer: SuperJSON,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
            headers: headers ? headers : options?.headers,
          });
        },
      }),
    ],
  });
};
