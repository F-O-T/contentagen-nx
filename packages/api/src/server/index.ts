import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { waitlistRouter } from "./router/waitlist";
import { agentFileRouter } from "./router/agent-file";
import type { MinioClient } from "@packages/files/client";
import type { ChromaClient } from "@packages/chroma-db/client";
import { agentRouter } from "./router/agent";
import { agentKnowledgeRouter } from "./router/agent-knowledge";
import { contentRouter } from "./router/content";
import { exportLogRouter } from "./router/export-log";
import { notificationRouter } from "./router/notification";
import { notificationPreferencesRouter } from "./router/notification-preferences";

import { sessionRouter } from "./router/session";

export const appRouter = router({
   waitlist: waitlistRouter,
   agent: agentRouter,
   agentFile: agentFileRouter,
   agentKnowledge: agentKnowledgeRouter,
   content: contentRouter,
   exportLog: exportLogRouter,
   notification: notificationRouter,
   notificationPreferences: notificationPreferencesRouter,
   sessionHelper: sessionRouter,
});
export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
   chromaClient,
}: {
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
         }),
   };
};

export type AppRouter = typeof appRouter;
