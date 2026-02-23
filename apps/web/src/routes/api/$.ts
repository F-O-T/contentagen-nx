import "@/polyfill";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { onError } from "@orpc/server";
import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin } from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createFileRoute } from "@tanstack/react-router";

import router from "@/integrations/orpc/router";
import type { ORPCContextWithAuth } from "@/integrations/orpc/server";
import { auth, db, posthog } from "@/integrations/orpc/server-instances";

const handler = new RPCHandler(router, {
   interceptors: [
      onError((error) => {
         console.error(error);
      }),
   ],
   plugins: [
      new CompressionPlugin(),

      new BatchHandlerPlugin(),
      new SmartCoercionPlugin({
         schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
   ],
});

async function handle({ request }: { request: Request }) {
   const headers = new Headers(request.headers);
   let session: ORPCContextWithAuth["session"] = null;
   try {
      session = await auth.api.getSession({ headers });
   } catch {
      session = null;
   }

   const { response } = await handler.handle(request, {
      prefix: "/api",
      context: {
         headers,
         request,
         auth,
         db,
         session,
         posthog,
      } satisfies ORPCContextWithAuth,
   });

   return response ?? new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/$")({
   server: {
      handlers: {
         HEAD: handle,
         GET: handle,
         POST: handle,
         PUT: handle,
         PATCH: handle,
         DELETE: handle,
      },
   },
});
