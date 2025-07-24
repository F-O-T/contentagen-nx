import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { serverEnv as env } from "@packages/environment/server";
import { ArcjetShield } from "./integrations/arcjet";
import { posthogPlugin } from "./integrations/posthog";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createApi } from "@packages/api/server";
import { auth } from "./integrations/auth";
import { db } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { chromaClient } from "./integrations/chromadb";
const trpcApi = createApi({
   chromaClient,
   minioClient,
   minioBucket: env.MINIO_BUCKET,
   auth,
   db,
});
const app = new Elysia()
   .use(
      cors({
         allowedHeaders: ["Content-Type", "Authorization"],
         credentials: true,
         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         origin: env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
      }),
   )
   .use(ArcjetShield)
   .use(posthogPlugin)
   .mount(auth.handler)
   .all("/trpc/*", async (opts) => {
      const res = await fetchRequestHandler({
         endpoint: "/trpc",
         router: trpcApi.trpcRouter,
         req: opts.request,
         createContext: async (c) => {
            return await trpcApi.createTRPCContext({ headers: c.req.headers });
         },
      });

      return res;
   })
   .listen(process.env.PORT ?? 9876);

console.log(
   `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app;
