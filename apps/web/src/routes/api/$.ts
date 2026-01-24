import "@/polyfill";

import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { createFileRoute } from "@tanstack/react-router";
import { onError } from "@orpc/server";

import router from "@/integrations/orpc/router";

const handler = new OpenAPIHandler(router, {
   interceptors: [
      onError((error) => {
         console.error(error);
      }),
   ],
   plugins: [
      new SmartCoercionPlugin({
         schemaConverters: [new ZodToJsonSchemaConverter()],
      }),
   ],
});

async function handle({ request }: { request: Request }) {
   const { response } = await handler.handle(request, {
      prefix: "/api",
      context: {},
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
