import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import { createTRPCContext as createTRPCContextInternal, router } from "./trpc";
import { waitlistRouter } from "./router/waitlist";
import { agentFileRouter } from "./router/agent-file";
import type { MinioClient } from "@packages/files/client";

import { agentRouter } from "./router/agent";

export const appRouter = router({
   waitlist: waitlistRouter,
   agent: agentRouter,
   agentFile: agentFileRouter,
});
export const createApi = ({
   auth,
   db,
   minioClient,
   minioBucket,
}: {
   minioBucket: string;
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
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
         }),
   };
};

export type AppRouter = typeof appRouter;
