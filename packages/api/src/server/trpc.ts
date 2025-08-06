import { initTRPC, TRPCError } from "@trpc/server";
import SuperJSON from "superjson";
import type { AuthInstance } from "@packages/authentication/server";
import type { DatabaseInstance } from "@packages/database/client";
import type { MinioClient } from "@packages/files/client";
import type { ChromaClient } from "@packages/chroma-db/client";
import type { OpenRouterClient } from "@packages/openrouter/client";
import { ensureAgentKnowledgeCollection } from "@packages/chroma-db/helpers";
export const createTRPCContext = async ({
   auth,
   db,
   headers,
   minioClient,
   minioBucket,
   chromaClient,
   openRouterClient,
}: {
   openRouterClient: OpenRouterClient; // Replace with actual type if available
   auth: AuthInstance;
   db: DatabaseInstance;
   minioClient: MinioClient;
   minioBucket: string;
   headers: Headers;
   chromaClient: ChromaClient;
}): Promise<{
   openRouterClient: OpenRouterClient; // Pass the OpenRouter client to the context
   minioBucket: string;
   db: DatabaseInstance;
   minioClient: MinioClient;
   chromaClient: ChromaClient;
   session: AuthInstance["$Infer"]["Session"] | null;
}> => {
   const session = await auth.api.getSession({
      headers,
   });
const collection = await ensureAgentKnowledgeCollection(chromaClient);
if(!collection) {
      throw new TRPCError({
         code: "INTERNAL_SERVER_ERROR",
         message: "Failed to ensure agent knowledge collection",
      });
   }
   return {
      openRouterClient,
      minioBucket,
      minioClient,
      db,
      chromaClient,
      session,
   };
};

export const t = initTRPC
   .context<ReturnType<typeof createTRPCContext>>()
   .create({
      transformer: SuperJSON,
   });

export const router = t.router;
const isAuthed = t.middleware(async ({ ctx, next }) => {
   const resolvedCtx = await ctx;
   if (!resolvedCtx.session?.user) {
      throw new TRPCError({ code: "FORBIDDEN" });
   }
   return next({
      ctx: {
         session: { ...resolvedCtx.session },
      },
   });
});
const timingMiddleware = t.middleware(async ({ next, path }) => {
   const start = Date.now();
   const result = await next();
   const end = Date.now();

   console.info(`[TRPC] ${path} took ${end - start}ms to execute`);

   return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);
export const protectedProcedure = publicProcedure.use(isAuthed);
