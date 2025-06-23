import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { env } from "./config/env";
import { authMiddleware, OpenAPI } from "./integrations/auth";
import { agentRoutes } from "./routes/agent-routes";
import { waitlistRoutes } from "./routes/waitlist-routes";

export const app = new Elysia({ aot: false })
  .use(authMiddleware)
  .use(
    cors({
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      origin: env.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
    }),
  )
  .use(
    swagger({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(agentRoutes)
  .use(waitlistRoutes)
  .get("/works", () => {
    return { message: "Eden WORKS!" };
  })
  .listen(9876);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
