import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { env, isProduction } from "./config/env";
import { bullAuth } from "./guards/bull-auth-guard";
import { authMiddleware, OpenAPI } from "./integrations/auth";
import { ArcjetShield } from "./integrations/arcjet";
import { agentRoutes } from "./routes/agent-routes";
import { contentManagementRoutes } from "./routes/content-management-routes";
import { contentRequestRoutes } from "./routes/content-request-routes";
import { fileRoutes } from "./routes/file-routes";
import { waitlistRoutes } from "./routes/waitlist-routes";
import { contentGenerationQueue } from "./workers/content-generation";
import { distillQueue } from "./workers/distill-worker";
import { knowledgeChunkQueue } from "./workers/knowledge-chunk-worker";
const serverAdapter = new ElysiaAdapter("/ui");

createBullBoard({
   queues: [
      new BullMQAdapter(contentGenerationQueue),
      new BullMQAdapter(distillQueue),
      new BullMQAdapter(knowledgeChunkQueue), // Register the Elysia adapter queue
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
   .use(
      swagger({
         path: "/docs", // Swagger UI will be at /docs, JSON at /docs/json
         documentation: {
            components: await OpenAPI.components,
            paths: await OpenAPI.getPaths(),
         },
      }),
   )
   .use(ArcjetShield)
   .group(
      "/api/v1",
      (
         api, // Group all API routes under /api/v1
      ) =>
         api
            .use(authMiddleware)
            .use(agentRoutes)
            .use(fileRoutes)
            .group("/content", (content) =>
               content.use(contentManagementRoutes).use(contentRequestRoutes),
            )
            .use(waitlistRoutes)
            .get("/works", () => {
               return { message: "Eden WORKS!" };
            }),
   )
   .listen(process.env.PORT ?? 9876);

console.log(
   `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
export type App = typeof app;
