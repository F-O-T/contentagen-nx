import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { agentFileRouter } from "./router/agent-file";
import type { MinioClient } from "@packages/files/client";
import type { ChromaClient } from "@packages/chroma-db/client";
import { agentRouter } from "./router/agent";
import { contentRouter } from "./router/content";

import { sessionRouter } from "./router/session";
import { sdkRouter } from "./router/sdk";
import type { OpenRouterClient } from "@packages/openrouter/client";

export const appRouter = router({
   agent: agentRouter,
   agentFile: agentFileRouter,
   content: contentRouter,
   sessionHelper: sessionRouter,
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
