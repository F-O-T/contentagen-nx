import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { env } from "./config/env";
import { authMiddleware, OpenAPI } from "./integrations/auth";
import { agentRoutes } from "./routes/agent-routes";
import { contentRoutes } from "./routes/content-routes";
import { waitlistRoutes } from "./routes/waitlist-routes";
import { contentGenerationQueue } from "./workers/content-generation";

const serverAdapter = new ElysiaAdapter("/ui");

createBullBoard({
   queues: [new BullMQAdapter(contentGenerationQueue)],
   serverAdapter,
});

const app = new Elysia().use(serverAdapter.registerPlugin()).use(
   swagger({
      path: "/docs", // Swagger UI will be at /docs, JSON at /docs/json
      documentation: {
         components: await OpenAPI.components,
         paths: await OpenAPI.getPaths(),
      },
   }),
)
   .group(
      "/api/v1",
      (
         api, // Group all API routes under /api/v1
      ) =>
         api
            .use(
               cors({
                  allowedHeaders: ["Content-Type", "Authorization"],
                  credentials: true,
                  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                  origin: env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
               }),
            )
            .use(authMiddleware)
            .use(agentRoutes)
            .use(contentRoutes)
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
