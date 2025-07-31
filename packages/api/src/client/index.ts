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
               const requestHeaders = new Headers(options?.headers);

               if (headers) {
                  const incomingHeaders = new Headers(headers as Headers);
                  const cookie = incomingHeaders.get("cookie");
                  if (cookie) {
                     requestHeaders.set("cookie", cookie);
                  }
                  const authorization = incomingHeaders.get("authorization");
                  if (authorization) {
                     requestHeaders.set("authorization", authorization);
                  }
               }
               return fetch(url, {
                  ...options,
                  credentials: "include",
                  headers: requestHeaders,
               });
            },
         }),
      ],
   });
};
