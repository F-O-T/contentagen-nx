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
import { chromaClient, openRouterClient } from "./integrations/chromadb";
import { bullAuth } from "./integrations/bull-auth-guard";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { createBullBoard } from "@bull-board/api";
import { autoBrandKnowledgeQueue } from "@packages/workers/queues/auto-brand-knowledge";
import { contentGenerationQueue } from "@packages/workers/queues/content-generation";
import { chunkSavingQueue } from "@packages/workers/queues/chunk-saving";
import { knowledgeDistillationQueue } from "@packages/workers/queues/knowledge-distillation";
import { isProduction } from "@packages/environment/helpers";
const serverAdapter = new ElysiaAdapter("/ui");

createBullBoard({
   queues: [
      new BullMQAdapter(contentGenerationQueue),
      new BullMQAdapter(knowledgeDistillationQueue), // Register the knowledge distillation queue
      new BullMQAdapter(autoBrandKnowledgeQueue), // Register the auto brand knowledge queue
      new BullMQAdapter(chunkSavingQueue), // Register the chunk saving queue
   ],
   serverAdapter,
   options: {
      uiBasePath: isProduction ? "node_modules/@bull-board/ui" : "",
   },
});
const trpcApi = createApi({
   chromaClient,
   openRouterClient,
   minioClient,
   minioBucket: env.MINIO_BUCKET,
   auth,
   db,
});
const app = new Elysia()
   .use(
      cors({
         allowedHeaders: ["Content-Type", "Authorization", "sdk-api-key"],
         credentials: true,
         methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         origin: (request: Request) => {
            const url = new URL(request.url);

            // Allow all origins for SDK endpoints
            if (url.pathname.startsWith("/trpc/sdk")) {
               return true;
            }

            // Use trusted origins for other endpoints
            const origin = request.headers.get("origin");
            const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGINS.split(",");
            return trustedOrigins.includes(origin || "");
         },
      }),
   )
   .use(ArcjetShield)
   .use(posthogPlugin)
   .mount(auth.handler)
   .all(
      "/trpc/*",
      async (opts) => {
         const res = await fetchRequestHandler({
            endpoint: "/trpc",
            router: trpcApi.trpcRouter,
            req: opts.request,
            createContext: async () =>
               await trpcApi.createTRPCContext({
                  headers: opts.request.headers,
               }),
         });

         return res;
      },
      {
         parse: "none",
      },
   )
   .onBeforeHandle(({ request }) => {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/ui")) {
         return bullAuth(request);
      }
   })
   .use(serverAdapter.registerPlugin())
   .listen(process.env.PORT ?? 9876);

console.log(
   `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app;
