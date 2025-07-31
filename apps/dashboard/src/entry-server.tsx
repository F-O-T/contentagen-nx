import { pipeline } from "node:stream/promises";
import {
   RouterServer,
   createRequestHandler,
   renderRouterToStream,
} from "@tanstack/react-router/ssr/server";
import { createRouter } from "./router";
import type express from "express";
import "./fetch-polyfill";
import {
   TRPCProvider,
   makeQueryClient,
   makeTrpcClient,
} from "./integrations/clients";
import type { AppRouter } from "@packages/api/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { QueryClientProvider } from "@tanstack/react-query";

export async function render({
   req,
   res,
   head,
}: {
   head: string;
   req: express.Request;
   res: express.Response;
}) {
   const url = new URL(req.originalUrl || req.url, "https://localhost:3000")
      .href;
   const request = new Request(url, {
      method: req.method,
      headers: new Headers(req.headers as HeadersInit),
   });

   const handler = createRequestHandler({
      request,
      createRouter: () => {
         // Create request-scoped instances
         const queryClient = makeQueryClient();
         const trpcClient = makeTrpcClient(request.headers);
         const trpc = createTRPCOptionsProxy<AppRouter>({
            client: trpcClient,
            queryClient,
         });

         const router = createRouter({ trpc, queryClient, trpcClient });

         router.update({
            context: {
               ...router.options.context,
               head: head,
            },
         });
         return router;
      },
   });

   const response = await handler(({ request, responseHeaders, router }) => {
      // Get the request-scoped clients from the router context
      const { queryClient, trpcClient } = router.options.context;

      return renderRouterToStream({
         request,
         responseHeaders,
         router,
         // Wrap the app in the request-scoped providers
         children: (
            <QueryClientProvider client={queryClient}>
               <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
                  <RouterServer router={router} />
               </TRPCProvider>
            </QueryClientProvider>
         ),
      });
   });

   // Convert the fetch response back to an express response
   res.statusMessage = response.statusText;
   res.status(response.status);

   response.headers.forEach((value, name) => {
      res.setHeader(name, value);
   });

   // Stream the response body
   // biome-ignore lint/suspicious/noExplicitAny: This is a known pattern for bridging fetch Response streams and Node.js streams
   return pipeline(response.body as any, res);
}
