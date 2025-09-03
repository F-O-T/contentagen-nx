import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { serverEnv as env } from "@packages/environment/server";
import { ArcjetShield } from "./integrations/arcjet";
import { posthogPlugin } from "./integrations/posthog";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createApi } from "@packages/api/server";
import { auth, polarClient } from "./integrations/auth";
import { db } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { chromaClient, openRouterClient } from "./integrations/chromadb";
import { bullAuth } from "./integrations/bull-auth-guard";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { createBullBoard } from "@bull-board/api";
import { billingLlmIngestionQueue } from "@packages/workers/queues/billing-llm-ingestion-queue";
import { billingWebSearchIngestionQueue } from "@packages/workers/queues/billing-websearch-ingestion-queue";
import { contentEditingQueue } from "@packages/workers/queues/content/content-editing-queue";
import { contentPostProcessingQueue } from "@packages/workers/queues/content/content-post-processing-queue";
import { contentResearchingQueue } from "@packages/workers/queues/content/content-researching-queue";
import { contentPlanningQueue } from "@packages/workers/queues/content/content-planning-queue";
import { contentWritingQueue } from "@packages/workers/queues/content/content-writing-queue";

import { ideasPlanningQueue } from "@packages/workers/queues/ideas/ideas-planning-queue";
import { ideasGenerationQueue } from "@packages/workers/queues/ideas/ideas-generation-queue";
import { ideasGrammarCheckQueue } from "@packages/workers/queues/ideas/ideas-grammar-checker-queue";
import { ideasPostProcessingQueue } from "@packages/workers/queues/ideas/ideas-post-processing-queue";
import { contentGrammarCheckQueue } from "@packages/workers/queues/content/content-grammar-checker-queue";
import { chunkSavingQueue } from "@packages/workers/queues/knowledge/chunk-saving";
import { documentChunkQueue } from "@packages/workers/queues/knowledge/document-chunk-queue";
import { brandCrawlQueue } from "@packages/workers/queues/knowledge/brand-knowledge-crawl";
import { brandAnalyzeQueue } from "@packages/workers/queues/knowledge/brand-knowledge-analyze";
import { brandUploadQueue } from "@packages/workers/queues/knowledge/brand-knowledge-upload";
import { brandCreateDocsQueue } from "@packages/workers/queues/knowledge/brand-knowledge-create-docs";

import { isProduction } from "@packages/environment/helpers";
const serverAdapter = new ElysiaAdapter("/ui");

createBullBoard({
   queues: [
      new BullMQAdapter(brandAnalyzeQueue),
      new BullMQAdapter(brandUploadQueue),
      new BullMQAdapter(brandCreateDocsQueue),
      new BullMQAdapter(contentGrammarCheckQueue),
      new BullMQAdapter(brandCrawlQueue),
      new BullMQAdapter(chunkSavingQueue),
      new BullMQAdapter(documentChunkQueue),

      new BullMQAdapter(ideasPlanningQueue),
      new BullMQAdapter(ideasGenerationQueue),
      new BullMQAdapter(ideasGrammarCheckQueue),
      new BullMQAdapter(ideasPostProcessingQueue),
      new BullMQAdapter(billingLlmIngestionQueue),
      new BullMQAdapter(billingWebSearchIngestionQueue),
      new BullMQAdapter(contentEditingQueue),
      new BullMQAdapter(contentPostProcessingQueue),
      new BullMQAdapter(contentResearchingQueue),
      new BullMQAdapter(contentPlanningQueue),
      new BullMQAdapter(contentWritingQueue),
   ],
   serverAdapter,
   options: {
      uiBasePath: isProduction ? "node_modules/@bull-board/ui" : "",
   },
});
const trpcApi = createApi({
   polarClient,
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
