import type { AuthInstance } from "@packages/authentication/server";
import type { Polar } from "@polar-sh/sdk";
import type { DatabaseInstance } from "@packages/database/client";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { agentFileRouter } from "./router/agent-file";
import type { MinioClient } from "@packages/files/client";
import type { PgVectorDatabaseInstance } from "@packages/rag/client";
import { agentRouter } from "./router/agent";
import { contentRouter } from "./router/content";
import { statisticsRouter } from "./router/statistics";
import { authHelpersRouter } from "./router/auth-helpers";
import { sdkRouter } from "./router/sdk";
import { ideasRouter } from "./router/ideas";
import { preferencesRouter } from "./router/preferences";
import { competitorRouter } from "./router/competitor";
import { competitorFileRouter } from "./router/competitor-file";

export const appRouter = router({
   agent: agentRouter,
   agentFile: agentFileRouter,
   content: contentRouter,
   authHelpers: authHelpersRouter,
   statistics: statisticsRouter,
   ideas: ideasRouter,
   sdk: sdkRouter,
   preferences: preferencesRouter,
   competitor: competitorRouter,
   competitorFile: competitorFileRouter,
});
export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
   ragClient,
   polarClient,
}: {
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   ragClient: PgVectorDatabaseInstance;
   polarClient: Polar;
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
            ragClient,
            polarClient,
         }),
   };
};

export type AppRouter = typeof appRouter;
