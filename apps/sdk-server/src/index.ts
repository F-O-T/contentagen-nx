import cors from "@elysiajs/cors";
import { env } from "@packages/environment/server";
import { Elysia } from "elysia";
import { auth } from "./integrations/auth";
import { db } from "./integrations/database";
import { minioClient } from "./integrations/minio";
import { posthog } from "./integrations/posthog";
import { sdkEventRoutes } from "./routes/sdk-events";
import { sdkFormRoutes } from "./routes/sdk-forms";
import { sdkRoutes } from "./routes/sdk";

const app = new Elysia({
   serve: {
      idleTimeout: 0,
   },
})
   .derive(() => ({
      auth,
      db,
      minioBucket: env.MINIO_BUCKET,
      minioClient,
      posthog,
   }))
   .use(
      cors({
         allowedHeaders: ["Content-Type", "sdk-api-key", "X-API-Key", "X-Locale"],
         credentials: true,
         methods: ["GET", "POST", "OPTIONS"],
         origin: true,
      }),
   )
   .use(sdkRoutes)
   .use(sdkEventRoutes)
   .use(sdkFormRoutes)
   .get("/health", () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
   }))
   .listen(process.env.PORT ?? 9877);

console.log(`SDK Server started on port ${app.server?.port}`);

export type App = typeof app;
