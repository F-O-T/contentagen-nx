import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { agentFileRouter } from "./router/agent-file";
import type { MinioClient } from "@packages/files/client";
import type { ChromaClient } from "@packages/chroma-db/client";
import { agentRouter } from "./router/agent";
import { contentRouter } from "./router/content";
import { statisticsRouter } from "./router/statistics";
import { authHelpersRouter } from "./router/auth-helpers";
import { sdkRouter } from "./router/sdk";
import { ideasRouter } from "./router/ideas";
import type { OpenRouterClient } from "@packages/openrouter/client";

export const appRouter = router({
   agent: agentRouter,
   agentFile: agentFileRouter,
   content: contentRouter,
   authHelpers: authHelpersRouter,
   statistics: statisticsRouter,
   ideas: ideasRouter,
   sdk: sdkRouter,
});
export const createApi = ({
   auth,
   openRouterClient,
   db,
   minioClient,
   minioBucket,
   chromaClient,
}: {
   openRouterClient: OpenRouterClient; // Replace with actual type if available
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   chromaClient: ChromaClient;
}) => {
   return {
      trpcRouter: appRouter,
      createTRPCContext: async ({ headers }: { headers: Headers }) =>
         await createTRPCContextInternal({
            minioClient,
            auth,
            db,
            headers,
            minioBucket,
            chromaClient,
            openRouterClient, // Pass the OpenRouter client to the context
         }),
   };
};

export type AppRouter = typeof appRouter;
