import "@/polyfill";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { onError } from "@orpc/server";
import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin } from "@orpc/server/plugins";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createFileRoute } from "@tanstack/react-router";

import router from "@/integrations/orpc/router";

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
   const { response } = await handler.handle(request, {
      prefix: "/api",
      context: {} as any,
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
