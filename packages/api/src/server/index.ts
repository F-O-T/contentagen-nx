import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { waitlistRouter } from "./router/waitlist";
import { agentFileRouter } from "./router/agent-file";
import type { MinioClient } from "@packages/files/client";

import { agentRouter } from "./router/agent";
import { agentKnowledgeRouter } from "./router/agent-knowledge";

export const appRouter = router({
  waitlist: waitlistRouter,
  agent: agentRouter,
  agentFile: agentFileRouter,
  agentKnowledge: agentKnowledgeRouter,
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
  chromaClient: any;
}) => {
  return {
    trpcRouter: appRouter,
    createTRPCContext: ({ headers }: { headers: Headers }) =>
      createTRPCContextInternal({
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
