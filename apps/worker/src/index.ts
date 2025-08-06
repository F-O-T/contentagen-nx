import cors from "@elysiajs/cors";
import { Elysia } from "elysia";
import { serverEnv as env } from "@packages/environment/server";
import { bullAuth } from "./integrations/bull-auth-guard";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { createBullBoard } from "@bull-board/api";
import { autoBrandKnowledgeQueue } from "@packages/workers/queues/auto-brand-knowledge";
import { contentGenerationQueue } from "@packages/workers/queues/content-generation";
import { knowledgeDistillationQueue } from "@packages/workers/queues/knowledge-distillation";
import { isProduction } from "@packages/environment/helpers";
const serverAdapter = new ElysiaAdapter("/ui");

createBullBoard({
   queues: [
      new BullMQAdapter(contentGenerationQueue),
      new BullMQAdapter(knowledgeDistillationQueue), // Register the knowledge distillation queue
      new BullMQAdapter(autoBrandKnowledgeQueue), // Register the auto brand knowledge queue
   ],

   serverAdapter,

   options: {
      uiBasePath: isProduction ? "node_modules/@bull-board/ui" : "",
   },
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
   .onBeforeHandle(({ request }) => {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/ui")) {
         return bullAuth(request);
      }
   })

   .use(serverAdapter.registerPlugin())
   .listen(process.env.PORT ?? 9876);

console.log(
   `🦊 Workers is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app;
